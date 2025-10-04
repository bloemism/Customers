import { supabase } from '../lib/supabase';

// Stripe Connect関連の型定義
export interface ConnectedAccount {
  id: string;
  email: string;
  businessName: string;
  businessType: 'individual' | 'company';
  country: string;
  currency: string;
  status: 'pending' | 'restricted' | 'active';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export interface PaymentFees {
  totalAmount: number;
  platformFee: number;
  stripeFee: number;
  storeAmount: number;
}

export interface PaymentTransaction {
  id: string;
  storeId: string;
  customerId?: string;
  stripePaymentIntentId: string;
  amount: number;
  platformFee: number;
  stripeFee: number;
  storeAmount: number;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  createdAt: string;
}

export class StripeConnectService {
  // Connected Account作成
  static async createConnectedAccount(storeData: {
    email: string;
    businessName: string;
    businessType: 'individual' | 'company';
    country: string;
    currency: string;
    phone?: string;
    address?: string;
  }): Promise<{ data: ConnectedAccount | null; error: string | null }> {
    try {
      console.log('Connected Account作成開始:', storeData);

      // Supabase Edge Function経由でStripe APIを呼び出し
      const { data, error } = await supabase.functions.invoke('create-connected-account', {
        body: storeData
      });

      if (error) {
        console.error('Connected Account作成エラー:', error);
        return { data: null, error: error.message };
      }

      console.log('Connected Account作成成功:', data);
      return { data, error: null };

    } catch (error) {
      console.error('Connected Account作成エラー:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Connected Account作成に失敗しました' 
      };
    }
  }

  // 店舗のConnected Account情報取得
  static async getConnectedAccount(storeId: string): Promise<{ data: ConnectedAccount | null; error: string | null }> {
    try {
      // まずデータベースからStripe Account IDを取得
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('stripe_account_id')
        .eq('id', storeId)
        .single();

      if (storeError || !store?.stripe_account_id) {
        return { data: null, error: '店舗のStripe Account IDが見つかりません' };
      }

      // Supabase Edge Function経由でStripe APIを呼び出し
      const { data, error } = await supabase.functions.invoke('get-connected-account', {
        body: { accountId: store.stripe_account_id }
      });

      if (error) {
        console.error('Connected Account取得エラー:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };

    } catch (error) {
      console.error('Connected Account取得エラー:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Connected Account取得に失敗しました' 
      };
    }
  }

  // 手数料計算
  static async calculateFees(amount: number): Promise<{ data: PaymentFees | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_payment_fees', {
          amount_cents: Math.round(amount * 100) // 円をセントに変換
        })
        .single();

      if (error) {
        console.error('手数料計算エラー:', error);
        return { data: null, error: error.message };
      }

      // セントを円に変換
      const fees: PaymentFees = {
        totalAmount: data.total_amount / 100,
        platformFee: data.platform_fee / 100,
        stripeFee: data.stripe_fee / 100,
        storeAmount: data.store_amount / 100
      };

      return { data: fees, error: null };

    } catch (error) {
      console.error('手数料計算エラー:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : '手数料計算に失敗しました' 
      };
    }
  }

  // Connect決済の作成
  static async createConnectPayment(paymentData: {
    amount: number;
    storeId: string;
    customerId?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{ data: { clientSecret: string; paymentIntentId: string } | null; error: string | null }> {
    try {
      console.log('Connect決済作成開始:', paymentData);

      // 手数料計算
      const { data: fees, error: feesError } = await this.calculateFees(paymentData.amount);
      if (feesError || !fees) {
        return { data: null, error: feesError || '手数料計算に失敗しました' };
      }

      // Supabase Edge Function経由でStripe APIを呼び出し
      const { data, error } = await supabase.functions.invoke('create-connect-payment', {
        body: {
          amount: Math.round(paymentData.amount * 100), // セントに変換
          storeId: paymentData.storeId,
          customerId: paymentData.customerId,
          applicationFeeAmount: Math.round(fees.platformFee * 100),
          description: paymentData.description,
          metadata: paymentData.metadata
        }
      });

      if (error) {
        console.error('Connect決済作成エラー:', error);
        return { data: null, error: error.message };
      }

      console.log('Connect決済作成成功:', data);
      return { data, error: null };

    } catch (error) {
      console.error('Connect決済作成エラー:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Connect決済作成に失敗しました' 
      };
    }
  }

  // 決済履歴取得
  static async getPaymentTransactions(storeId: string, limit: number = 50): Promise<{ data: PaymentTransaction[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          id,
          store_id,
          customer_id,
          stripe_payment_intent_id,
          amount,
          platform_fee,
          stripe_fee,
          store_amount,
          status,
          created_at
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('決済履歴取得エラー:', error);
        return { data: null, error: error.message };
      }

      // セントを円に変換
      const transactions: PaymentTransaction[] = (data || []).map(transaction => ({
        id: transaction.id,
        storeId: transaction.store_id,
        customerId: transaction.customer_id,
        stripePaymentIntentId: transaction.stripe_payment_intent_id,
        amount: transaction.amount / 100,
        platformFee: transaction.platform_fee / 100,
        stripeFee: transaction.stripe_fee / 100,
        storeAmount: transaction.store_amount / 100,
        status: transaction.status,
        createdAt: transaction.created_at
      }));

      return { data: transactions, error: null };

    } catch (error) {
      console.error('決済履歴取得エラー:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : '決済履歴取得に失敗しました' 
      };
    }
  }

  // 店舗の決済設定取得
  static async getStorePaymentSettings(storeId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('store_payment_settings')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error && error.code !== 'PGRST116') { // データが見つからない場合はエラーではない
        console.error('店舗決済設定取得エラー:', error);
        return { data: null, error: error.message };
      }

      return { data: data || null, error: null };

    } catch (error) {
      console.error('店舗決済設定取得エラー:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : '店舗決済設定取得に失敗しました' 
      };
    }
  }

  // 店舗の決済設定更新
  static async updateStorePaymentSettings(storeId: string, settings: {
    autoTransferEnabled?: boolean;
    transferSchedule?: 'daily' | 'weekly' | 'monthly';
    minimumTransferAmount?: number;
    bankAccountInfo?: any;
    taxId?: string;
    businessLicense?: string;
  }): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('store_payment_settings')
        .upsert({
          store_id: storeId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('店舗決済設定更新エラー:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };

    } catch (error) {
      console.error('店舗決済設定更新エラー:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : '店舗決済設定更新に失敗しました' 
      };
    }
  }

  // 店舗のStripe Connect状況確認
  static async checkConnectStatus(storeId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          stripe_account_id,
          stripe_account_status,
          stripe_account_verified,
          stripe_connect_enabled
        `)
        .eq('id', storeId)
        .single();

      if (storeError) {
        console.error('店舗情報取得エラー:', storeError);
        return { data: null, error: storeError.message };
      }

      return { data: store, error: null };

    } catch (error) {
      console.error('Connect状況確認エラー:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Connect状況確認に失敗しました' 
      };
    }
  }
}
