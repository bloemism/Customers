import { supabase } from '../lib/supabase';

export interface CustomerPoint {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  current_points: number;
  total_earned_points: number;
  total_used_points: number;
  last_transaction_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  customer_id: string;
  transaction_type: 'earn' | 'use';
  points: number;
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
}

export class PointService {
  // 顧客のポイント情報を取得
  static async getCustomerPoints(customerPhone: string): Promise<CustomerPoint | null> {
    try {
      const { data, error } = await supabase
        .from('customer_points')
        .select('*')
        .eq('customer_phone', customerPhone)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 顧客が見つからない場合
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('ポイント情報取得エラー:', error);
      return null;
    }
  }

  // 新しい顧客のポイントアカウントを作成
  static async createCustomerPoints(customerData: {
    name: string;
    phone: string;
    email?: string;
  }): Promise<CustomerPoint | null> {
    try {
      const { data, error } = await supabase
        .from('customer_points')
        .insert({
          customer_name: customerData.name,
          customer_phone: customerData.phone,
          customer_email: customerData.email,
          current_points: 0,
          total_earned_points: 0,
          total_used_points: 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('顧客ポイントアカウント作成エラー:', error);
      return null;
    }
  }

  // ポイントを付与（売上の5%）
  static async earnPoints(
    customerId: string,
    amount: number,
    description: string
  ): Promise<boolean> {
    try {
      const points = Math.round(amount * 0.05); // 5%のポイント

      // ポイントを更新
      const { error: updateError } = await supabase
        .from('customer_points')
        .update({
          current_points: supabase.rpc('increment', { row_id: customerId, increment_amount: points }),
          total_earned_points: supabase.rpc('increment', { row_id: customerId, increment_amount: points }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (updateError) {
        throw updateError;
      }

      // 取引履歴を記録
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          customer_id: customerId,
          transaction_type: 'earn',
          points,
          amount,
          description,
          transaction_date: new Date().toISOString(),
        });

      if (transactionError) {
        throw transactionError;
      }

      return true;
    } catch (error) {
      console.error('ポイント付与エラー:', error);
      return false;
    }
  }

  // ポイントを使用
  static async usePoints(
    customerId: string,
    points: number,
    amount: number,
    description: string
  ): Promise<boolean> {
    try {
      // 現在のポイントを確認
      const { data: customerData, error: fetchError } = await supabase
        .from('customer_points')
        .select('current_points')
        .eq('id', customerId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (customerData.current_points < points) {
        throw new Error('ポイントが不足しています');
      }

      // ポイントを減算
      const { error: updateError } = await supabase
        .from('customer_points')
        .update({
          current_points: customerData.current_points - points,
          total_used_points: supabase.rpc('increment', { row_id: customerId, increment_amount: points }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (updateError) {
        throw updateError;
      }

      // 取引履歴を記録
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          customer_id: customerId,
          transaction_type: 'use',
          points: -points,
          amount,
          description,
          transaction_date: new Date().toISOString(),
        });

      if (transactionError) {
        throw transactionError;
      }

      return true;
    } catch (error) {
      console.error('ポイント使用エラー:', error);
      return false;
    }
  }

  // 顧客の取引履歴を取得
  static async getCustomerTransactions(customerId: string): Promise<PointTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('取引履歴取得エラー:', error);
      return [];
    }
  }
}




