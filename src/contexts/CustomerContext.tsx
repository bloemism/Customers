import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Customer, PointHistory, CustomerPayment } from '../types/customer';
import { normalizeBirthDateForDb } from '../utils/birthDateDb';
import { selectCustomerByAuthUserId } from '../utils/customerRowQuery';
import { supabaseErrorMessage } from '../utils/supabaseErrorMessage';

interface CustomerContextType {
  customer: Customer | null;
  loading: boolean;
  error: string | null;
  fetchCustomerData: () => Promise<void>;
  updateCustomerProfile: (data: Partial<Customer>) => Promise<void>;
  addPoints: (amount: number, reason: string) => Promise<void>;
  usePoints: (amount: number, reason: string) => Promise<void>;
  getPointHistory: () => Promise<PointHistory[]>;
  getPaymentHistory: () => Promise<CustomerPayment[]>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

interface CustomerProviderProps {
  children: ReactNode;
}

export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const customerRowIdRef = useRef<string | null>(null);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        customerRowIdRef.current = null;
        setCustomer(null);
        return;
      }

      console.log('🔍 顧客データ取得開始:', user.id);

      const { error: linkErr } = await supabase.rpc('ensure_customer_user_id_from_auth');
      if (linkErr) {
        console.warn('[CustomerContext] ensure_customer_user_id_from_auth:', linkErr.message);
      }

      const { data: row, error: selErr } = await selectCustomerByAuthUserId(user.id);
      if (selErr) {
        console.error('❌ 顧客データ取得エラー:', selErr);
        setError(selErr.message);
        return;
      }

      if (!row) {
        console.log('⚠️ 顧客データが存在しません');
        customerRowIdRef.current = null;
        setCustomer(null);
        return;
      }

      const levelRaw = (row as { level?: unknown }).level;

      const normalized: Customer = {
        ...(row as object),
        user_id: String((row as { user_id?: string }).user_id ?? user.id),
        name: String((row as { name?: string }).name ?? ''),
        email: String((row as { email?: string }).email ?? user.email ?? ''),
        points: Number((row as { points?: number }).points ?? 0),
        level:
          typeof levelRaw === 'number' && !Number.isNaN(levelRaw)
            ? levelRaw
            : typeof levelRaw === 'string' && /^\d+$/.test(levelRaw)
              ? Number(levelRaw)
              : (levelRaw as string) || 'BASIC',
        address_2: (row as { address_2?: string }).address_2
      } as Customer;
      console.log('✅ 顧客データ取得成功:', normalized);
      customerRowIdRef.current = (row as { id?: string }).id ?? null;
      setCustomer(normalized);

      const { data: codeRes, error: codeErr } = await supabase.rpc('ensure_my_customer_code');
      if (codeErr) {
        console.warn('[CustomerContext] ensure_my_customer_code:', codeErr.message);
      } else if (codeRes && typeof codeRes === 'object' && 'customer_code' in codeRes) {
        const cc = (codeRes as { customer_code?: string }).customer_code;
        if (cc) {
          setCustomer((prev) => (prev ? { ...prev, customer_code: cc } : prev));
        }
      }
    } catch (err) {
      console.error('❌ 予期しないエラー:', err);
      setError('データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerProfile = async (data: Partial<Customer>) => {
    try {
      // 本番ドメインで JWT が古いと RPC / RLS が不一致になることがあるため先に更新
      await supabase.auth.refreshSession().catch(() => {});

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const { error: linkErr } = await supabase.rpc('ensure_customer_user_id_from_auth');
      if (linkErr) {
        console.warn('[CustomerContext] ensure_customer_user_id_from_auth:', linkErr.message);
      }

      const addressLine = [data.address, data.address_2].filter(Boolean).join(' ').trim();

      const birthNormalized =
        data.birth_date !== undefined
          ? typeof data.birth_date === 'string' && data.birth_date.trim() === ''
            ? ''
            : normalizeBirthDateForDb(String(data.birth_date ?? '')) ?? ''
          : undefined;

      const patch: Record<string, string> = {};
      if (data.name !== undefined) patch.name = String(data.name ?? '');
      if (data.phone !== undefined) patch.phone = String(data.phone ?? '');
      if (data.address !== undefined || data.address_2 !== undefined) patch.address = addressLine;
      if (data.birth_date !== undefined) patch.birth_date = birthNormalized ?? '';

      const rpcMissing = (msg: string | undefined, code?: string) =>
        Boolean(
          msg &&
            (msg.includes('save_my_customer_profile') ||
              msg.includes('update_my_customer_profile') ||
              msg.includes('Could not find the function') ||
              code === 'PGRST202')
        );

      const runSaveProfileRpc = async () => {
        let r = await supabase.rpc('save_my_customer_profile', {
          p_profile: patch
        });
        const missSave =
          r.error &&
          (r.error.code === 'PGRST202' ||
            (r.error.message?.includes('save_my_customer_profile') ?? false) ||
            (r.error.message?.includes('Could not find the function') ?? false));
        if (missSave) {
          console.warn('[CustomerContext] save_my_customer_profile 未デプロイ → update_my_customer_profile');
          r = await supabase.rpc('update_my_customer_profile', {
            p_profile: patch
          });
        }
        return r;
      };

      let { data: rpcRes, error: rpcErr } = await runSaveProfileRpc();

      if (rpcErr && !rpcMissing(rpcErr.message, rpcErr.code)) {
        console.warn('[CustomerContext] update_my_customer_profile RPC error:', rpcErr.message);
      }

      let saved = Boolean(
        !rpcErr && rpcRes && typeof rpcRes === 'object' && (rpcRes as { ok?: boolean }).ok === true
      );

      const rpcBodyFailed =
        rpcRes && typeof rpcRes === 'object' && (rpcRes as { ok?: boolean }).ok === false;
      if (rpcBodyFailed) {
        const err = (rpcRes as { error?: string }).error;
        if (err === 'not_authenticated') {
          throw new Error('ログインの有効期限が切れています。再度ログインしてください。');
        }
        if (err === 'no_row_updated') {
          await supabase.rpc('ensure_customer_user_id_from_auth').catch(() => {});
          const second = await runSaveProfileRpc();
          rpcRes = second.data;
          rpcErr = second.error;
          saved = Boolean(
            !rpcErr &&
              rpcRes &&
              typeof rpcRes === 'object' &&
              (rpcRes as { ok?: boolean }).ok === true
          );
          if (!saved) {
            console.warn('[CustomerContext] update_my_customer_profile no_row_updated → 直接 UPDATE を試行');
          }
        } else {
          console.warn('[CustomerContext] update_my_customer_profile:', rpcRes);
        }
      }

      if (!saved) {
        if (rpcErr && rpcMissing(rpcErr.message, rpcErr.code)) {
          console.warn('[CustomerContext] update_my_customer_profile が未デプロイ。直接 UPDATE にフォールバックします。');
        }

        const payload: Record<string, unknown> = {
          user_id: user.id,
          updated_at: new Date().toISOString()
        };
        if (data.name !== undefined) payload.name = data.name?.trim() || '未設定';
        if (data.phone !== undefined) payload.phone = data.phone?.trim() || null;
        if (data.birth_date !== undefined) {
          payload.birth_date =
            typeof data.birth_date === 'string' && data.birth_date.trim() === ''
              ? null
              : normalizeBirthDateForDb(data.birth_date as string);
        }
        if (data.address !== undefined || data.address_2 !== undefined) {
          payload.address = addressLine || null;
        }

        // 表示できている行と同じ取得経路で PK を決め、単一の eq(id) で更新（RLS / フィルタのブレを減らす）
        const { data: existingRow, error: selErr } = await selectCustomerByAuthUserId(user.id);
        if (selErr) {
          throw new Error(supabaseErrorMessage(selErr));
        }

        const rowId = existingRow ? String((existingRow as { id: string }).id) : '';
        if (rowId) {
          const { data: updRows, error: upErr } = await supabase
            .from('customers')
            .update(payload)
            .eq('id', rowId)
            .select('id');
          if (upErr) {
            throw new Error(supabaseErrorMessage(upErr));
          }
          if (!updRows?.length) {
            throw new Error(
              'customers の更新が 0 件でした。Supabase の RLS（本人の UPDATE 許可）と update_my_customer_profile の適用を確認してください。'
            );
          }
        } else {
          const insBirth =
            typeof data.birth_date === 'string' && data.birth_date.trim() === ''
              ? null
              : normalizeBirthDateForDb(data.birth_date as string);
          const { error: insErr } = await supabase.from('customers').insert({
            id: user.id,
            user_id: user.id,
            email: user.email!,
            name: (data.name as string)?.trim() || '未設定',
            phone: data.phone?.trim() || null,
            address: addressLine || null,
            birth_date: insBirth,
            points: 0,
            level: 'BASIC'
          });
          if (insErr) {
            throw new Error(supabaseErrorMessage(insErr));
          }
        }
      }

      await fetchCustomerData();

      const { data: codeRes, error: codeErr } = await supabase.rpc('ensure_my_customer_code');
      if (codeErr) {
        console.warn('[CustomerContext] ensure_my_customer_code:', codeErr.message);
      } else if (codeRes && typeof codeRes === 'object' && 'customer_code' in codeRes) {
        const cc = (codeRes as { customer_code?: string }).customer_code;
        if (cc) {
          setCustomer((prev) => (prev ? { ...prev, customer_code: cc } : prev));
        }
      }
    } catch (err) {
      const text = supabaseErrorMessage(err);
      console.error('プロフィール更新エラー:', text, err);
      throw new Error(text);
    }
  };

  const addPoints = async (amount: number, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const { error } = await supabase
        .from('point_history')
        .insert({
          user_id: user.id,
          points: amount,
          reason,
          type: 'earned'
        });

      if (error) throw error;

      await fetchCustomerData();
    } catch (err) {
      console.error('ポイント追加エラー:', err);
      throw err;
    }
  };

  const usePoints = async (amount: number, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const { error } = await supabase
        .from('point_history')
        .insert({
          user_id: user.id,
          points: -amount,
          reason,
          type: 'used'
        });

      if (error) throw error;

      await fetchCustomerData();
    } catch (err) {
      console.error('ポイント使用エラー:', err);
      throw err;
    }
  };

  const getPointHistory = async (): Promise<PointHistory[]> => {
    try {
      if (!customer) {
        console.error('顧客データが存在しません');
        return [];
      }
      const userId = customer.user_id;
      const customerId = (customer as { id?: string }).id;
      const idForQuery = userId || customerId;
      if (!idForQuery) return [];

      console.log('ポイント履歴取得開始:', idForQuery);

      let data: Record<string, unknown>[] | null = null;

      const { data: byUser, error: errUser } = await supabase
        .from('point_history')
        .select('*')
        .eq('user_id', userId ?? idForQuery)
        .order('created_at', { ascending: false });

      if (!errUser && byUser?.length) {
        data = byUser;
      } else if (customerId) {
        const { data: byCustomer } = await supabase
          .from('point_history')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
        data = byCustomer;
      }

      const list = (data || []).map((row: Record<string, unknown>) => {
        const pts = Number(row.points_change ?? row.points ?? 0);
        return {
          id: row.id,
          user_id: row.user_id,
          customer_id: row.customer_id,
          points: pts,
          reason: String(row.description ?? row.reason ?? ''),
          type: (row.transaction_type === 'use' || row.transaction_type === 'spent' || pts < 0 ? 'used' : 'earned') as 'earned' | 'used',
          created_at: row.created_at as string | undefined
        };
      });

      console.log('ポイント履歴取得成功:', list.length, '件');
      return list;
    } catch (err) {
      console.error('ポイント履歴取得エラー:', err);
      return [];
    }
  };

  const getPaymentHistory = async (): Promise<CustomerPayment[]> => {
    try {
      if (!customer) {
        console.error('顧客データが存在しません');
        return [];
      }
      const customerId = (customer as { id?: string }).id;
      const userId = customer.user_id;
      const idForQuery = customerId || userId;
      if (!idForQuery) return [];

      console.log('決済履歴取得開始:', idForQuery);

      const { data, error } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('customer_id', customerId ?? idForQuery)
        .order('created_at', { ascending: false });

      if (error) {
        const { data: altData, error: altErr } = await supabase
          .from('customer_payments')
          .select('*')
          .eq('user_id', userId ?? idForQuery)
          .order('created_at', { ascending: false });
        if (altErr) {
          console.error('決済履歴取得エラー:', error);
          return [];
        }
        console.log('決済履歴取得成功:', altData?.length || 0, '件');
        return (altData || []) as CustomerPayment[];
      }

      console.log('決済履歴取得成功:', data?.length || 0, '件');
      return (data || []) as CustomerPayment[];
    } catch (err) {
      console.error('決済履歴取得エラー:', err);
      return [];
    }
  };

  useEffect(() => {
    void fetchCustomerData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        customerRowIdRef.current = null;
        setCustomer(null);
        setError(null);
        setLoading(false);
        return;
      }
      if (
        session?.user &&
        (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED')
      ) {
        void fetchCustomerData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: CustomerContextType = {
    customer,
    loading,
    error,
    fetchCustomerData,
    updateCustomerProfile,
    addPoints,
    usePoints,
    getPointHistory,
    getPaymentHistory
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};
