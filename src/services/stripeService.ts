import { supabase } from '../lib/supabase';
import { stripePromise, SUBSCRIPTION_PRODUCTS } from '../lib/stripe';
import type { SubscriptionStatus, PaymentMethod } from '../lib/stripe';

export class StripeService {
  // サブスクリプション作成
  static async createSubscription(priceId: string, customerEmail: string) {
    try {
      console.log('Stripe Checkout開始:', { priceId, customerEmail });
      
      // クライアントサイド統合を使用（Client-only integrationが有効）
      const stripe = await stripePromise;
      console.log('Stripeインスタンス:', stripe ? '初期化済み' : '未初期化');
      
      if (stripe) {
        // テスト用の簡易版（最小限のパラメータ）
        const checkoutParams = {
          lineItems: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          successUrl: `${window.location.origin}/subscription-management?success=true`,
          cancelUrl: `${window.location.origin}/subscription-management?canceled=true`,
        };
        
        console.log('Checkoutパラメータ:', checkoutParams);
        
        const { error } = await stripe.redirectToCheckout(checkoutParams);
        
        if (error) {
          console.error('Stripe Checkoutエラー:', error);
          throw new Error(error.message);
        }
        
        console.log('Stripe Checkout成功 - リダイレクト中...');
      } else {
        throw new Error('Stripeが初期化されていません');
      }
    } catch (error) {
      console.error('サブスクリプション作成エラー:', error);
      throw error;
    }
  }

  // サブスクリプション状態の取得
  static async getSubscriptionStatus(storeId: string): Promise<SubscriptionStatus | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          stripe_subscription_id,
          plan_id,
          plan_name,
          plan_price
        `)
        .eq('store_id', storeId)
        .single();

      if (error) {
        // テーブルが存在しない場合はnullを返す（エラーを出さない）
        if (error.code === 'PGRST205') {
          console.log('サブスクリプションテーブルが存在しません。開発環境では無視されます。');
          return null;
        }
        // データが0行の場合もnullを返す
        if (error.code === 'PGRST116') {
          console.log('サブスクリプションデータが存在しません。');
          return null;
        }
        console.error('サブスクリプション状態取得エラー:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        status: data.status,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        planId: data.plan_id,
        planName: data.plan_name,
        planPrice: data.plan_price,
      };
    } catch (error) {
      console.error('サブスクリプション状態取得エラー:', error);
      return null;
    }
  }

  // 支払い方法の取得
  static async getPaymentMethods(storeId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select(`
          id,
          type,
          card_brand,
          card_last4,
          card_exp_month,
          card_exp_year
        `)
        .eq('store_id', storeId);

      if (error) {
        // テーブルが存在しない場合は空配列を返す（エラーを出さない）
        if (error.code === 'PGRST205') {
          console.log('支払い方法テーブルが存在しません。開発環境では無視されます。');
          return [];
        }
        console.error('支払い方法取得エラー:', error);
        return [];
      }

      return data?.map(method => ({
        id: method.id,
        type: method.type as 'card',
        card: {
          brand: method.card_brand,
          last4: method.card_last4,
          expMonth: method.card_exp_month,
          expYear: method.card_exp_year,
        },
      })) || [];
    } catch (error) {
      console.error('支払い方法取得エラー:', error);
      return [];
    }
  }

  // サブスクリプションキャンセル
  static async cancelSubscription(storeId: string) {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
        }),
      });

      if (!response.ok) {
        throw new Error('サブスクリプションキャンセルに失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('サブスクリプションキャンセルエラー:', error);
      throw error;
    }
  }

  // サブスクリプション更新
  static async updateSubscription(storeId: string, newPriceId: string) {
    try {
      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
          newPriceId,
        }),
      });

      if (!response.ok) {
        throw new Error('サブスクリプション更新に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('サブスクリプション更新エラー:', error);
      throw error;
    }
  }

  // 利用可能なプランの取得
  static getAvailablePlans() {
    return Object.values(SUBSCRIPTION_PRODUCTS);
  }

  // プラン名からプラン情報を取得
  static getPlanById(planId: string) {
    return Object.values(SUBSCRIPTION_PRODUCTS).find(plan => plan.id === planId);
  }
}
