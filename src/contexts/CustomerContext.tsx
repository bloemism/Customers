import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Customer, PointHistory, CustomerPayment } from '../types/customer';

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

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCustomer(null);
        return;
      }

      console.log('🔍 顧客データ取得開始:', user.id);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 顧客データが存在しない場合
          console.log('⚠️ 顧客データが存在しません');
          setCustomer(null);
        } else {
          console.error('❌ 顧客データ取得エラー:', error);
          setError(error.message);
        }
      } else {
        console.log('✅ 顧客データ取得成功:', data);
        setCustomer(data);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが認証されていません');

      const { error } = await supabase
        .from('customers')
        .upsert({
          user_id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await fetchCustomerData();
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
      throw err;
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
      if (!customer || !customer.id) {
        console.error('顧客データが存在しません');
        return [];
      }

      console.log('ポイント履歴取得開始:', customer.user_id);

      const { data, error } = await supabase
        .from('point_history')
        .select('*')
        .eq('user_id', customer.user_id?.toString() || customer.id?.toString()) // user_idはauth.usersのid（text型）
        .order('created_at', { ascending: false });

      if (error) {
        console.error('ポイント履歴取得エラー:', error);
        throw error;
      }

      console.log('ポイント履歴取得成功:', data?.length || 0, '件');
      console.log('ポイント履歴データ（マッピング前）:', data);
      
      // データベースのカラム名をPointHistory型にマッピング
      const mappedData: PointHistory[] = (data || []).map((item: any) => {
        const points = Math.abs(item.points_change || 0);
        const type = item.transaction_type === 'earned' ? 'earned' : 'used';
        const reason = item.description || item.reason || '';
        
        console.log('ポイント履歴マッピング:', {
          original: item,
          mapped: { points, type, reason }
        });
        
        return {
          id: item.id,
          user_id: item.user_id,
          points: points, // points_changeの絶対値を使用
          reason: reason, // descriptionをreasonにマッピング
          type: type, // transaction_typeをtypeにマッピング
          created_at: item.created_at
        };
      });
      
      console.log('ポイント履歴データ（マッピング後）:', mappedData);
      return mappedData;
    } catch (err) {
      console.error('ポイント履歴取得エラー:', err);
      return [];
    }
  };

  const getPaymentHistory = async (): Promise<CustomerPayment[]> => {
    try {
      if (!customer || !customer.id) {
        console.error('顧客データが存在しません');
        return [];
      }

      console.log('決済履歴取得開始:', customer.user_id);

      const { data, error } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('user_id', customer.user_id?.toString() || customer.id?.toString()) // user_idはauth.usersのid（text型）
        .order('created_at', { ascending: false });

      if (error) {
        console.error('決済履歴取得エラー:', error);
        throw error;
      }

      console.log('決済履歴取得成功:', data?.length || 0, '件');
      return data || [];
    } catch (err) {
      console.error('決済履歴取得エラー:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchCustomerData();
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
