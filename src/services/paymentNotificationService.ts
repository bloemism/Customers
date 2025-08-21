import { supabase } from '../lib/supabase';

export interface PaymentNotification {
  id: string;
  transactionId: string;
  customerId: string;
  storeId: string;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'failed' | 'pending';
  timestamp: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface TransactionData {
  transactionId: string;
  totalAmount: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  customerId?: string;
  storeId: string;
  timestamp: string;
  pointsUsed?: number;
  pointsEarned?: number;
  customerName?: string;
}

class PaymentNotificationService {
  private listeners: Map<string, (notification: PaymentNotification) => void> = new Map();

  // 決済完了通知の監視を開始
  async startListening(transactionId: string, callback: (notification: PaymentNotification) => void) {
    this.listeners.set(transactionId, callback);

    // Supabaseのリアルタイムサブスクリプションを設定
    const subscription = supabase
      .channel(`payment_notifications_${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_notifications',
          filter: `transaction_id=eq.${transactionId}`
        },
        (payload) => {
          console.log('決済完了通知を受信:', payload);
          const notification = payload.new as PaymentNotification;
          callback(notification);
        }
      )
      .subscribe();

    return subscription;
  }

  // 決済完了通知の監視を停止
  stopListening(transactionId: string) {
    this.listeners.delete(transactionId);
    supabase.channel(`payment_notifications_${transactionId}`).unsubscribe();
  }

  // 決済状況を手動で確認
  async checkPaymentStatus(transactionId: string): Promise<PaymentNotification | null> {
    try {
      const { data, error } = await supabase
        .from('payment_notifications')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('決済状況確認エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('決済状況確認エラー:', error);
      return null;
    }
  }

  // 取引データをSupabaseに保存
  async saveTransaction(transactionData: TransactionData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          transaction_id: transactionData.transactionId,
          customer_id: transactionData.customerId,
          store_id: transactionData.storeId,
          total_amount: transactionData.totalAmount,
          status: 'pending',
          created_at: transactionData.timestamp,
          items: transactionData.items
        }]);

      if (error) {
        console.error('取引データ保存エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('取引データ保存エラー:', error);
      return false;
    }
  }

  // 決済完了時に顧客データを更新
  async updateCustomerData(notification: PaymentNotification): Promise<boolean> {
    try {
      // 購入履歴を追加
      const { error: historyError } = await supabase
        .from('purchase_history')
        .insert([{
          customer_id: notification.customerId,
          store_id: notification.storeId,
          purchase_date: notification.timestamp,
          total_amount: notification.amount,
          tax_amount: Math.floor(notification.amount * 0.1), // 10%の消費税
          points_earned: Math.floor(notification.amount * 0.01), // 1%のポイント
          points_used: 0,
          payment_method: notification.paymentMethod
        }]);

      if (historyError) {
        console.error('購入履歴保存エラー:', historyError);
        return false;
      }

      // 顧客の統計情報を更新
      const { error: customerError } = await supabase
        .rpc('update_customer_statistics', {
          customer_id: notification.customerId,
          purchase_amount: notification.amount,
          points_earned: Math.floor(notification.amount * 0.01)
        });

      if (customerError) {
        console.error('顧客統計更新エラー:', customerError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('顧客データ更新エラー:', error);
      return false;
    }
  }

  // 取引状況を更新
  async updateTransactionStatus(transactionId: string, status: 'completed' | 'failed'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId);

      if (error) {
        console.error('取引状況更新エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('取引状況更新エラー:', error);
      return false;
    }
  }

  // ポーリングによる決済状況確認（WebSocketが使えない場合の代替）
  startPolling(transactionId: string, callback: (notification: PaymentNotification | null) => void, interval: number = 5000) {
    const poll = async () => {
      const notification = await this.checkPaymentStatus(transactionId);
      if (notification) {
        callback(notification);
        return; // 通知を受信したらポーリングを停止
      }
    };

    // 即座に1回チェック
    poll();

    // 定期的にチェック
    const intervalId = setInterval(poll, interval);

    // クリーンアップ関数を返す
    return () => {
      clearInterval(intervalId);
    };
  }
}

export const paymentNotificationService = new PaymentNotificationService();
