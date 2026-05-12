import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { normalizeBirthDateForDb } from '../utils/birthDateDb';

interface Customer {
  id: string; // Supabase auth.users.id (UUID)
  email: string;
  name: string;
  alphabet?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  customer_code?: string;
  points: number;
  level: 'BASIC' | 'REGULAR' | 'PRO' | 'EXPERT';
  created_at: string;
  updated_at: string;
}

interface SchoolRegistration {
  id: string;
  lesson_school_id: string;
  lesson_school_name: string;
  store_name: string;
  registered_at: string;
  is_active: boolean;
}

interface TechnicalLevel {
  id: string;
  customer_id: string;
  lesson_school_id: string;
  lesson_school_name: string;
  total_points: number;
  current_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  level_achieved_at: string;
}

interface TechnicalPoint {
  id: string;
  customer_id: string;
  lesson_schedule_id: string;
  lesson_school_id: string;
  points_awarded: number;
  point_type: string;
  description: string;
  awarded_at: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; user?: any }>;
  registerCustomerData: (name: string, alphabet?: string, address?: string, birth_date?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
  getRegisteredSchools: () => Promise<SchoolRegistration[]>;
  registerToSchool: (schoolId: string) => Promise<{ error?: string }>;
  unregisterFromSchool: (registrationId: string) => Promise<{ error?: string }>;
  getTechnicalLevels: () => Promise<TechnicalLevel[]>;
  getTechnicalPointsHistory: (schoolId?: string) => Promise<TechnicalPoint[]>;
}

/** 顧客アプリでは店舗オーナーのみ拒否。user_type 未設定は顧客として扱う（旧アカウント対策） */
function isStoreOwnerAccount(user: User | undefined | null): boolean {
  return user?.user_metadata?.user_type === 'store_owner';
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

export const CustomerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabaseのセッション状態を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Customer Auth state changed:', event, session);

      const unblock = () => setLoading(false);

      if (!session?.user) {
        setCustomer(null);
        localStorage.removeItem('customerAuth');
        unblock();
        return;
      }

      if (isStoreOwnerAccount(session.user)) {
        void supabase.auth
          .signOut()
          .then(() => setCustomer(null))
          .catch(() => setCustomer(null))
          .finally(unblock);
        return;
      }

      // 顧客: DB 取得でブロックしない（RPC/RLS でハングしてもガードのスピナーが止まる）
      unblock();
      if (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION' ||
        event === 'USER_UPDATED' ||
        event === 'TOKEN_REFRESHED'
      ) {
        void fetchCustomerData(session.user.id);
      }
    });

    // 初期セッション（onAuthStateChange の INITIAL_SESSION と二重になり得るが許容）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isStoreOwnerAccount(session.user)) {
        void fetchCustomerData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const applyCustomerRow = (row: Record<string, unknown>) => {
    const levelRaw = String(row.level ?? 'BASIC').toUpperCase();
    const level: Customer['level'] =
      levelRaw === 'REGULAR' || levelRaw === 'PRO' || levelRaw === 'EXPERT' ? levelRaw : 'BASIC';

    const customerData: Customer = {
      id: String(row.id ?? ''),
      email: String(row.email ?? ''),
      name: String(row.name ?? '未設定'),
      alphabet: (row.alphabet as string | null | undefined) || undefined,
      phone: (row.phone as string | null | undefined) || undefined,
      address: (row.address as string | null | undefined) || undefined,
      birth_date: (row.birth_date as string | null | undefined) || undefined,
      customer_code: (row.customer_code as string | null | undefined) || undefined,
      points: Number(row.points ?? row.current_points ?? 0),
      level,
      created_at: String(row.created_at ?? new Date().toISOString()),
      updated_at: String(row.updated_at ?? new Date().toISOString())
    };
    setCustomer(customerData);
    localStorage.setItem('customerAuth', JSON.stringify(customerData));
  };

  /** customer_code が空のとき DB の RPC で発行（ensure_my_customer_code.sql が必要） */
  const tryAssignCustomerCode = async (row: Record<string, unknown>) => {
    const existing = row.customer_code as string | null | undefined;
    if (existing && String(existing).trim()) return;
    const { data: ccRes, error: ccErr } = await supabase.rpc('ensure_my_customer_code');
    if (ccErr) {
      console.warn('[customers] ensure_my_customer_code:', ccErr.message);
      return;
    }
    if (ccRes && typeof ccRes === 'object' && 'customer_code' in ccRes) {
      const cc = (ccRes as { customer_code?: string }).customer_code;
      if (cc) applyCustomerRow({ ...row, customer_code: cc });
    }
  };

  /** user_id 優先、次に id（= auth.uid のレガシー行）。select * で列不足エラーを避ける */
  const selectCustomerRowByAuthUser = async (userId: string) => {
    const run = () => supabase.from('customers').select('*');

    const { data: byUserId, error: errUserId } = await run().eq('user_id', userId).maybeSingle();
    if (errUserId) {
      console.error('customers user_id 取得エラー:', errUserId);
      return { data: null as Record<string, unknown> | null, error: errUserId };
    }
    if (byUserId) {
      return { data: byUserId as Record<string, unknown>, error: null };
    }

    const { data: byId, error: errId } = await run().eq('id', userId).maybeSingle();
    if (errId) {
      console.error('customers id 取得エラー:', errId);
      return { data: null, error: errId };
    }
    return { data: byId as Record<string, unknown> | null, error: null };
  };

  const fetchCustomerData = async (userId: string) => {
    try {
      console.log('顧客データ取得開始:', userId);

      // DB 上で user_id が NULL / 誤りのとき RLS により行が返らない。RPC で補正（SQL 再適用が必要な場合あり）
      const { data: linkResult, error: linkErr } =
        await supabase.rpc('ensure_customer_user_id_from_auth');
      if (linkErr) {
        console.warn('[customers] ensure_customer_user_id_from_auth:', linkErr.message);
      } else {
        console.log('[customers] ensure_customer_user_id_from_auth:', linkResult);
      }

      const { data, error } = await selectCustomerRowByAuthUser(userId);
      console.log('customersテーブル取得結果:', { data, error });

      if (error) {
        console.error('顧客データ取得エラー:', error);
        setCustomer(null);
        return;
      }

      if (data) {
        const uid = data.user_id as string | null | undefined;
        const rowId = data.id as string | undefined;
        if (!uid && rowId === userId) {
          const { error: syncErr } = await supabase
            .from('customers')
            .update({ user_id: userId })
            .eq('id', userId);
          if (syncErr) {
            console.warn('user_id 補正スキップ（RLS またはスキーマ）:', syncErr);
          }
        }
        console.log('顧客データ取得成功:', data);
        applyCustomerRow(data);
        await tryAssignCustomerCode(data);
        return;
      }

      console.log('顧客データが見つかりません。新規作成を試行します。');
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        console.log('authUser.userが存在しません');
        setCustomer(null);
        return;
      }

      const { error: insertError } = await supabase.from('customers').insert({
        id: authUser.user.id,
        user_id: authUser.user.id,
        email: authUser.user.email!,
        name: authUser.user.user_metadata?.name || '未設定',
        alphabet: null,
        phone: authUser.user.user_metadata?.phone || null,
        points: 0,
        level: 'BASIC'
      });

      if (insertError) {
        console.error('顧客データ自動作成エラー:', insertError);
        // 別経路で既に行がある（例: UNIQUE email）の可能性 — 再取得
        const { data: retry } = await selectCustomerRowByAuthUser(userId);
        if (retry) {
          applyCustomerRow(retry);
          await tryAssignCustomerCode(retry);
        } else {
          setCustomer(null);
        }
        return;
      }

      const { data: newData, error: refetchErr } = await selectCustomerRowByAuthUser(userId);
      console.log('再取得結果:', newData, refetchErr);
      if (newData) {
        applyCustomerRow(newData);
        await tryAssignCustomerCode(newData);
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error('顧客データ取得エラー:', error);
      setCustomer(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('顧客ログイン試行:', email);
      
      // Supabaseでログイン
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('認証エラー:', error);
        return { error: error.message };
      }

      if (data.user) {
        console.log('認証成功、ユーザータイプ確認:', data.user.user_metadata?.user_type);

        if (isStoreOwnerAccount(data.user)) {
          console.log('店舗ユーザーが顧客ログインを試行、ログアウト');
          await supabase.auth.signOut();
          return { error: 'このアカウントは顧客アカウントではありません。店舗ログインをご利用ください。' };
        }

        // 旧ユーザーで user_type が無い場合は顧客としてメタデータを補完
        if (data.user.user_metadata?.user_type !== 'customer') {
          const { error: metaErr } = await supabase.auth.updateUser({
            data: { ...data.user.user_metadata, user_type: 'customer' }
          });
          if (metaErr) {
            console.warn('user_type 補完に失敗（続行）:', metaErr);
          }
        }

        void fetchCustomerData(data.user.id);
        console.log('認証成功、メニュー画面に遷移');
        return { error: undefined };
      }

      return { error: 'ログインに失敗しました' };
    } catch (error) {
      console.error('ログインエラー:', error);
      return { error: `ログインに失敗しました: ${error}` };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('顧客登録開始:', { email, name });
      
      // 新規登録なので既存ユーザーチェックは不要
      
      console.log('Supabase signUp開始');
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              user_type: 'customer'
            }
          }
        });
        
        console.log('認証レスポンス:', { authData, authError });
        
        if (authError) {
          console.error('認証エラー:', authError);
          return { error: authError.message };
        }

        if (authData.user) {
          // 登録直後のセッションでメニューに入ると顧客行とずれてゲスト表示になるため、
          // 必ずサインアウトしてログイン画面からメール認証させる
          await supabase.auth.signOut();
          setCustomer(null);
          localStorage.removeItem('customerAuth');
          console.log('新規登録完了: セッションを終了しログインへ誘導');
          return { error: undefined, user: authData.user };
        }

        return { error: 'ユーザー登録に失敗しました' };
      } catch (signUpError) {
        console.error('signUp実行エラー:', signUpError);
        return { error: `登録エラー: ${signUpError}` };
      }
    } catch (error: any) {
      console.error('ユーザー登録エラー:', error);
      return { error: `ユーザー登録に失敗しました: ${error.message}` };
    }
  };

  const registerCustomerData = async (name: string, alphabet?: string, address?: string, birth_date?: string) => {
    try {
      console.log('顧客データ登録開始:', { name, alphabet, address, birth_date });
      
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        return { error: '認証されていません' };
      }

      const isoBirthDate = normalizeBirthDateForDb(birth_date || '');
      console.log('誕生日変換:', { original: birth_date, converted: isoBirthDate });

      const { data: byUser } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', authUser.user.id)
        .maybeSingle();
      let existingCustomer = byUser;
      if (!existingCustomer) {
        const { data: byId } = await supabase
          .from('customers')
          .select('id')
          .eq('id', authUser.user.id)
          .maybeSingle();
        existingCustomer = byId;
      }

      let error;
      if (existingCustomer) {
        const iso = isoBirthDate ?? '';
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('update_my_customer_profile', {
          p_profile: {
            name,
            alphabet: alphabet ?? '',
            address: address ?? '',
            birth_date: iso
          }
        });
        const rpcOk =
          !rpcErr &&
          rpcRes &&
          typeof rpcRes === 'object' &&
          (rpcRes as { ok?: boolean }).ok === true;
        if (rpcOk) {
          error = undefined;
        } else {
          const { error: updateError } = await supabase
            .from('customers')
            .update({
              name,
              alphabet: alphabet || null,
              address: address || null,
              birth_date: isoBirthDate,
              updated_at: new Date().toISOString(),
              user_id: authUser.user.id
            })
            .eq('id', existingCustomer.id);
          error = rpcErr ?? updateError;
        }
      } else {
        // 新規レコードの場合は挿入
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            id: authUser.user.id,
            user_id: authUser.user.id,
            email: authUser.user.email!,
            name,
            alphabet: alphabet || null,
            address: address || null,
            birth_date: isoBirthDate,
            points: 0,
            level: 'BASIC'
          });
        error = insertError;
      }

      if (error) {
        console.error('顧客データ保存エラー:', error);
        return { error: `顧客データの保存に失敗しました: ${error.message}` };
      }

      console.log('顧客データ登録成功');
      // 顧客データを取得して状態を更新
      await fetchCustomerData(authUser.user.id);
      return { error: undefined };
    } catch (error: any) {
      console.error('顧客データ登録エラー:', error);
      return { error: `顧客データ登録に失敗しました: ${error.message}` };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
    setCustomer(null);
    localStorage.removeItem('customerAuth');
  };

  const refreshCustomer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchCustomerData(user.id);
    }
  };

  // 登録済みスクール一覧を取得
  const getRegisteredSchools = async (): Promise<SchoolRegistration[]> => {
    if (!customer?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('customer_school_registrations')
        .select(`
          id,
          lesson_school_id,
          registered_at,
          is_active,
          lesson_schools!inner(name, store_name)
        `)
        .eq('customer_id', customer.id)
        .eq('is_active', true);

      if (error) {
        console.error('登録スクール取得エラー:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        lesson_school_id: item.lesson_school_id,
        lesson_school_name: item.lesson_schools?.name || '不明',
        store_name: item.lesson_schools?.store_name || '不明',
        registered_at: item.registered_at,
        is_active: item.is_active
      })) || [];
    } catch (error) {
      console.error('登録スクール取得エラー:', error);
      return [];
    }
  };

  // スクールに登録
  const registerToSchool = async (schoolId: string): Promise<{ error?: string }> => {
    if (!customer?.id) {
      return { error: 'ログインが必要です' };
    }

    try {
      const { error } = await supabase
        .from('customer_school_registrations')
        .insert({
          customer_id: customer.id,
          lesson_school_id: schoolId
        });

      if (error) {
        console.error('スクール登録エラー:', error);
        return { error: 'スクール登録に失敗しました' };
      }

      return {};
    } catch (error) {
      console.error('スクール登録エラー:', error);
      return { error: 'スクール登録に失敗しました' };
    }
  };

  // スクール登録を解除
  const unregisterFromSchool = async (registrationId: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase
        .from('customer_school_registrations')
        .update({ is_active: false })
        .eq('id', registrationId);

      if (error) {
        console.error('スクール登録解除エラー:', error);
        return { error: 'スクール登録解除に失敗しました' };
      }

      return {};
    } catch (error) {
      console.error('スクール登録解除エラー:', error);
      return { error: 'スクール登録解除に失敗しました' };
    }
  };

  // 技術レベル一覧を取得
  const getTechnicalLevels = async (): Promise<TechnicalLevel[]> => {
    if (!customer?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('customer_technical_levels')
        .select(`
          *,
          lesson_schools!inner(name)
        `)
        .eq('customer_id', customer.id);

      if (error) {
        console.error('技術レベル取得エラー:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        customer_id: item.customer_id,
        lesson_school_id: item.lesson_school_id,
        lesson_school_name: item.lesson_schools?.name || '不明',
        total_points: item.total_points,
        current_level: item.current_level,
        level_achieved_at: item.level_achieved_at
      })) || [];
    } catch (error) {
      console.error('技術レベル取得エラー:', error);
      return [];
    }
  };

  // 技術ポイント履歴を取得
  const getTechnicalPointsHistory = async (schoolId?: string): Promise<TechnicalPoint[]> => {
    if (!customer?.id) return [];
    
    try {
      let query = supabase
        .from('technical_points')
        .select('*')
        .eq('customer_id', customer.id)
        .order('awarded_at', { ascending: false });

      if (schoolId) {
        query = query.eq('lesson_school_id', schoolId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('技術ポイント履歴取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('技術ポイント履歴取得エラー:', error);
      return [];
    }
  };

  return (
    <CustomerAuthContext.Provider value={{ 
      customer, 
      loading, 
      signIn, 
      signUp, 
      registerCustomerData,
      signOut, 
      refreshCustomer,
      getRegisteredSchools,
      registerToSchool,
      unregisterFromSchool,
      getTechnicalLevels,
      getTechnicalPointsHistory
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
};
