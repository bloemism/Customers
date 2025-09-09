import { supabase } from '../lib/supabase';

export interface PaymentRequest {
  id: string;
  store_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  points_to_use: number;
  payment_method: 'stripe_connect' | 'cash';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export class PaymentDataService {
  // 顧客情報を組み込んだ決済データを店舗に送信
  static async sendPaymentRequest(
    qrData: any,
    customerInfo: {
      customer_id: string;
      customer_name: string;
      customer_email: string;
      points_to_use: number;
    }
  ): Promise<{ success: boolean; request_id?: string; error?: string }> {
    try {
      console.log('決済リクエスト送信開始:', { qrData, customerInfo });

      // 決済リクエストデータを作成
      const paymentRequest: Omit<PaymentRequest, 'id' | 'created_at' | 'updated_at'> = {
        store_id: qrData.store_id,
        customer_id: customerInfo.customer_id,
        customer_name: customerInfo.customer_name,
        customer_email: customerInfo.customer_email,
        items: qrData.items,
        total: qrData.total,
        points_to_use: customerInfo.points_to_use,
        payment_method: 'stripe_connect',
        status: 'pending'
      };

      // データベースに決済リクエストを保存
      const { data, error } = await supabase
        .from('payment_requests')
        .insert([paymentRequest])
        .select()
        .single();

      if (error) {
        console.error('決済リクエスト保存エラー:', error);
        return { success: false, error: error.message };
      }

      console.log('決済リクエスト保存成功:', data);

      // 店舗側にリアルタイム通知を送信（Supabase Realtime）
      const { error: notifyError } = await supabase
        .from('payment_notifications')
        .insert([{
          store_id: qrData.store_id,
          customer_id: customerInfo.customer_id,
          customer_name: customerInfo.customer_name,
          total: qrData.total,
          request_id: data.id,
          type: 'payment_request',
          message: `${customerInfo.customer_name}さんから${qrData.total}円の決済リクエストが届きました`,
          created_at: new Date().toISOString()
        }]);

      if (notifyError) {
        console.error('通知送信エラー:', notifyError);
        // 通知エラーは決済リクエストの成功を妨げない
      }

      return { success: true, request_id: data.id };

    } catch (error) {
      console.error('決済リクエスト送信エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '決済リクエストの送信に失敗しました' 
      };
    }
  }

  // 店舗側：決済リクエスト一覧を取得
  static async getPaymentRequests(storeId: string): Promise<PaymentRequest[]> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('決済リクエスト取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('決済リクエスト取得エラー:', error);
      return [];
    }
  }

  // 店舗側：決済リクエストを承認/拒否
  static async updatePaymentRequestStatus(
    requestId: string, 
    status: 'approved' | 'rejected'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('決済リクエスト更新エラー:', error);
        return { success: false, error: error.message };
      }

      // 顧客側に通知を送信
      const { data: requestData } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestData) {
        await supabase
          .from('payment_notifications')
          .insert([{
            customer_id: requestData.customer_id,
            store_id: requestData.store_id,
            type: 'payment_response',
            message: status === 'approved' 
              ? '決済が承認されました。決済を完了してください。'
              : '決済が拒否されました。',
            request_id: requestId,
            created_at: new Date().toISOString()
          }]);
      }

      return { success: true };
    } catch (error) {
      console.error('決済リクエスト更新エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '決済リクエストの更新に失敗しました' 
      };
    }
  }

  // 顧客側：決済リクエストの状態を確認
  static async getPaymentRequestStatus(requestId: string): Promise<PaymentRequest | null> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('決済リクエスト状態確認エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('決済リクエスト状態確認エラー:', error);
      return null;
    }
  }
}
