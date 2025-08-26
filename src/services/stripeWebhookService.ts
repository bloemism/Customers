import { supabase } from '../lib/supabase';

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export class StripeWebhookService {
  // サブスクリプション作成時の処理
  static async handleSubscriptionCreated(subscription: any) {
    try {
      console.log('サブスクリプション作成イベント:', subscription.id);
      
      const storeId = subscription.metadata?.storeId;
      if (!storeId) {
        console.error('ストアIDが見つかりません');
        return;
      }

      // サブスクリプション情報をデータベースに保存
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          store_id: storeId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status: subscription.status,
          plan_id: subscription.items.data[0]?.price.id,
          plan_name: '87app 月額プラン',
          plan_price: subscription.items.data[0]?.price.unit_amount,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        });

      if (error) {
        console.error('サブスクリプション保存エラー:', error);
        throw error;
      }

      console.log('サブスクリプションが正常に保存されました');
    } catch (error) {
      console.error('サブスクリプション作成処理エラー:', error);
      throw error;
    }
  }

  // サブスクリプション更新時の処理
  static async handleSubscriptionUpdated(subscription: any) {
    try {
      console.log('サブスクリプション更新イベント:', subscription.id);
      
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('サブスクリプション更新エラー:', error);
        throw error;
      }

      console.log('サブスクリプションが正常に更新されました');
    } catch (error) {
      console.error('サブスクリプション更新処理エラー:', error);
      throw error;
    }
  }

  // サブスクリプションキャンセル時の処理
  static async handleSubscriptionDeleted(subscription: any) {
    try {
      console.log('サブスクリプション削除イベント:', subscription.id);
      
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('サブスクリプション削除エラー:', error);
        throw error;
      }

      console.log('サブスクリプションが正常にキャンセルされました');
    } catch (error) {
      console.error('サブスクリプション削除処理エラー:', error);
      throw error;
    }
  }

  // 支払い成功時の処理
  static async handlePaymentSucceeded(paymentIntent: any) {
    try {
      console.log('支払い成功イベント:', paymentIntent.id);
      
      const subscriptionId = paymentIntent.metadata?.subscription_id;
      if (!subscriptionId) {
        console.log('サブスクリプションIDが見つかりません');
        return;
      }

      // 決済履歴を保存
      const { error } = await supabase
        .from('payment_history')
        .insert({
          subscription_id: subscriptionId,
          stripe_payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          store_id: paymentIntent.metadata?.storeId
        });

      if (error) {
        console.error('決済履歴保存エラー:', error);
        throw error;
      }

      console.log('決済履歴が正常に保存されました');
    } catch (error) {
      console.error('支払い成功処理エラー:', error);
      throw error;
    }
  }

  // Webhookイベントの処理
  static async handleWebhookEvent(event: StripeWebhookEvent) {
    try {
      console.log('Webhookイベント処理開始:', event.type);
      
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
          
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
          
        default:
          console.log('未処理のイベントタイプ:', event.type);
      }
      
      console.log('Webhookイベント処理完了:', event.type);
    } catch (error) {
      console.error('Webhookイベント処理エラー:', error);
      throw error;
    }
  }

  // テスト用のWebhookイベント処理
  static async handleTestWebhookEvent(eventType: string, eventData: any) {
    try {
      console.log('テストWebhookイベント処理:', eventType);
      
      const mockEvent: StripeWebhookEvent = {
        id: 'evt_test_' + Date.now(),
        type: eventType,
        data: {
          object: eventData
        }
      };
      
      await this.handleWebhookEvent(mockEvent);
      console.log('テストWebhookイベント処理完了');
    } catch (error) {
      console.error('テストWebhookイベント処理エラー:', error);
      throw error;
    }
  }
}
