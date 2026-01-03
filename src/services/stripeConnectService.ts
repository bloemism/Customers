import { supabase } from '../lib/supabase';

// API Base URL（空の場合は相対パス）
// 環境変数が設定されていない場合、またはProduction環境のURLが設定されている場合は相対パスを使用
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
if (!API_BASE_URL || API_BASE_URL.includes('customers-three-rust.vercel.app')) {
  API_BASE_URL = ''; // 相対パスを使用
}

export interface ConnectedAccountInfo {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  email?: string;
  business_profile?: {
    name?: string;
    product_description?: string;
    support_email?: string;
  };
  requirements?: {
    currently_due?: string[];
    eventually_due?: string[];
    past_due?: string[];
  };
}

export interface StoreAccountInfo {
  id: string;
  name: string;
  stripe_account_id?: string;
  stripe_account_status?: string;
  stripe_charges_enabled?: boolean;
  stripe_payouts_enabled?: boolean;
  stripe_details_submitted?: boolean;
  stripe_onboarding_completed?: boolean;
}

export interface PaymentTransaction {
  id: string;
  store_id: string;
  customer_id: string;
  payment_code: string;
  stripe_payment_intent_id: string;
  amount: number;
  platform_fee: number;
  stripe_fee: number;
  store_amount: number;
  status: string;
  created_at: string;
  metadata?: any;
}

export interface RevenueStats {
  total_sales: number;
  total_transactions: number;
  total_platform_fees: number;
  total_stripe_fees: number;
  total_net_revenue: number;
  average_transaction_amount: number;
}

/**
 * Stripe Connected Accountを作成
 */
export const createConnectedAccount = async (
  storeId: string,
  email: string,
  businessName: string,
  businessType: 'individual' | 'company' = 'individual'
): Promise<{ success: boolean; accountId?: string; onboardingUrl?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/create-connected-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storeId,
        email,
        businessName,
        businessType,
        country: 'JP',
        currency: 'jpy',
      }),
    });

    const text = await response.text();
    if (!text) {
      throw new Error('空のレスポンスが返されました');
    }
    const data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(data.error || 'Connected Accountの作成に失敗しました');
    }

    return {
      success: true,
      accountId: data.accountId,
      onboardingUrl: data.onboardingUrl,
    };
  } catch (error) {
    console.error('Connected Account作成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connected Accountの作成に失敗しました',
    };
  }
};

/**
 * Connected Account情報を取得
 */
export const getConnectedAccount = async (
  storeId: string
): Promise<{ success: boolean; hasAccount: boolean; account?: ConnectedAccountInfo; store?: StoreAccountInfo; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-connected-account?storeId=${storeId}`);

    const text = await response.text();
    if (!text) {
      return { success: false, hasAccount: false, error: '空のレスポンスが返されました' };
    }
    const data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(data.error || 'アカウント情報の取得に失敗しました');
    }

    return {
      success: true,
      hasAccount: data.hasAccount,
      account: data.account,
      store: data.store,
    };
  } catch (error) {
    console.error('Connected Account情報取得エラー:', error);
    return {
      success: false,
      hasAccount: false,
      error: error instanceof Error ? error.message : 'アカウント情報の取得に失敗しました',
    };
  }
};

/**
 * オンボーディングリンクを再生成
 */
export const createAccountLink = async (
  storeId: string,
  accountId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/create-account-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storeId,
        accountId,
      }),
    });

    const text = await response.text();
    if (!text) {
      throw new Error('空のレスポンスが返されました');
    }
    const data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(data.error || 'オンボーディングリンクの作成に失敗しました');
    }

    return {
      success: true,
      url: data.url,
    };
  } catch (error) {
    console.error('オンボーディングリンク作成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'オンボーディングリンクの作成に失敗しました',
    };
  }
};

/**
 * 店舗の決済トランザクション履歴を取得
 */
export const getStoreTransactions = async (
  storeId: string,
  limit: number = 50
): Promise<{ success: boolean; transactions?: PaymentTransaction[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return {
      success: true,
      transactions: data as PaymentTransaction[],
    };
  } catch (error) {
    console.error('トランザクション履歴取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'トランザクション履歴の取得に失敗しました',
    };
  }
};

/**
 * 店舗の売上統計を取得
 */
export const getStoreRevenueStats = async (
  storeId: string,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; stats?: RevenueStats; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('get_store_revenue_stats', {
      p_store_id: storeId,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      stats: data[0] as RevenueStats,
    };
  } catch (error) {
    console.error('売上統計取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '売上統計の取得に失敗しました',
    };
  }
};

/**
 * 手数料を計算
 */
export const calculateFees = (amount: number): {
  total: number;
  platformFee: number;
  stripeFee: number;
  storeAmount: number;
} => {
  const platformFeeRate = 0.03; // 3%
  const stripeFeeRate = 0.036; // 3.6%
  const stripeFixedFee = 0; // Stripe Connectの場合、固定費は不要

  const platformFee = Math.round(amount * platformFeeRate);
  const stripeFee = Math.round(amount * stripeFeeRate) + stripeFixedFee;
  const storeAmount = amount - platformFee - stripeFee;

  return {
    total: amount,
    platformFee,
    stripeFee,
    storeAmount,
  };
};

/**
 * Stripe Connect決済を作成（手数料分割あり）
 */
export const createConnectPayment = async (
  amount: number,
  storeId: string,
  storeAccountId: string,
  customerId: string,
  paymentCode: string,
  metadata: any
): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
  try {
    const fees = calculateFees(amount);

    const response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // 円をセントに変換
        currency: 'jpy',
        application_fee_amount: fees.platformFee * 100,
        transfer_data: {
          destination: storeAccountId,
        },
        metadata: {
          ...metadata,
          customer_id: customerId,
          store_id: storeId,
          payment_code: paymentCode,
          platform_fee: fees.platformFee,
          stripe_fee: fees.stripeFee,
          store_amount: fees.storeAmount,
        },
      }),
    });

    const text = await response.text();
    if (!text) {
      throw new Error('空のレスポンスが返されました');
    }
    const data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(data.error || '決済の作成に失敗しました');
    }

    return {
      success: true,
      sessionId: data.sessionId,
    };
  } catch (error) {
    console.error('Connect決済作成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '決済の作成に失敗しました',
    };
  }
};
