import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface PaymentData {
  amount: number;
  store_connect_account_id: string;
  store_name: string;
  customer_id: string;
  points_to_use: number;
}

export interface PaymentResult {
  success: boolean;
  payment_intent_id?: string;
  error?: string;
  points_earned?: number;
}

export class CustomerStripeService {
  // Stripeインスタンスを取得
  static async getStripe() {
    return await stripePromise;
  }

  // QRコードから決済データを解析
  static parseQRCodeData(qrData: string): PaymentData | null {
    try {
      const data = JSON.parse(qrData);
      
      // 必要なフィールドが存在するかチェック
      if (!data.amount || !data.store_connect_account_id || !data.store_name) {
        throw new Error('QRコードデータが不完全です');
      }

      return {
        amount: data.amount,
        store_connect_account_id: data.store_connect_account_id,
        store_name: data.store_name,
        customer_id: data.customer_id || '',
        points_to_use: data.points_to_use || 0
      };
    } catch (error) {
      console.error('QRコードデータ解析エラー:', error);
      return null;
    }
  }

  // Stripe Connect決済を実行
  static async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      console.log('Stripe Connect決済開始:', paymentData);

      const stripe = await this.getStripe();
      if (!stripe) {
        throw new Error('Stripeが初期化されていません');
      }

      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      // 顧客データを取得
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (customerError || !customerData) {
        throw new Error('顧客データが見つかりません');
      }

      // ポイント使用可能かチェック
      if (paymentData.points_to_use > customerData.points) {
        throw new Error('使用ポイントが残高を超えています');
      }

      // 決済金額を計算（ポイント使用後）
      const finalAmount = Math.max(0, paymentData.amount - paymentData.points_to_use);

      // Stripe Payment Intentを作成
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          currency: 'jpy',
          application_fee_amount: Math.floor(finalAmount * 0.03), // 3%のプラットフォーム手数料
          transfer_data: {
            destination: paymentData.store_connect_account_id,
          },
          metadata: {
            store_name: paymentData.store_name,
            customer_id: customerData.user_id,
            points_used: paymentData.points_to_use.toString(),
            original_amount: paymentData.amount.toString(),
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '決済セッションの作成に失敗しました');
      }

      // Stripe Checkoutにリダイレクト
      const { error } = await stripe.redirectToCheckout({
        sessionId: result.sessionId,
      });

      if (error) {
        throw new Error(`決済リダイレクトエラー: ${error.message}`);
      }

      return {
        success: true,
        payment_intent_id: result.payment_intent_id,
        points_earned: Math.floor(finalAmount * 0.05) // 5%のポイント付与
      };

    } catch (error) {
      console.error('Stripe Connect決済エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '決済処理に失敗しました'
      };
    }
  }

  // 決済完了後の処理
  static async handlePaymentSuccess(paymentIntentId: string): Promise<PaymentResult> {
    try {
      console.log('決済完了処理開始:', paymentIntentId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      // 決済情報を取得
      const response = await fetch(`/api/payment-status/${paymentIntentId}`);
      const paymentStatus = await response.json();

      if (!paymentStatus.success) {
        throw new Error('決済情報の取得に失敗しました');
      }

      const { amount, points_used, points_earned } = paymentStatus.data;

      // 顧客データを更新
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          points: supabase.sql`points - ${points_used} + ${points_earned}`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('顧客データ更新エラー:', updateError);
        // エラーが発生しても決済は成功とする
      }

      // 決済履歴を記録
      const { error: historyError } = await supabase
        .from('customer_payments')
        .insert([
          {
            user_id: user.id,
            store_id: paymentStatus.data.store_id,
            amount: amount,
            points_used: points_used,
            payment_method: 'stripe_connect',
            status: 'completed',
            stripe_payment_intent_id: paymentIntentId,
            created_at: new Date().toISOString()
          }
        ]);

      if (historyError) {
        console.error('決済履歴記録エラー:', historyError);
        // エラーが発生しても決済は成功とする
      }

      // ポイント履歴を記録
      if (points_earned > 0) {
        const { error: pointError } = await supabase
          .from('point_history')
          .insert([
            {
              user_id: user.id,
              points: points_earned,
              reason: `決済完了 - ${paymentStatus.data.store_name}`,
              type: 'earned',
              created_at: new Date().toISOString()
            }
          ]);

        if (pointError) {
          console.error('ポイント履歴記録エラー:', pointError);
        }
      }

      return {
        success: true,
        payment_intent_id: paymentIntentId,
        points_earned: points_earned
      };

    } catch (error) {
      console.error('決済完了処理エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '決済完了処理に失敗しました'
      };
    }
  }

  // 決済状態を確認
  static async checkPaymentStatus(paymentIntentId: string): Promise<any> {
    try {
      const response = await fetch(`/api/payment-status/${paymentIntentId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '決済状態の確認に失敗しました');
      }

      return result;
    } catch (error) {
      console.error('決済状態確認エラー:', error);
      throw error;
    }
  }
}
