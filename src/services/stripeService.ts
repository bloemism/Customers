import { loadStripe } from '@stripe/stripe-js';

// Stripe公開キー（環境変数から取得）
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Stripeインスタンス
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Payment Intent作成
export const createPaymentIntent = async (amount: number, storeId: string, customerId: string) => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // 円をセントに変換
        currency: 'jpy',
        storeId,
        customerId,
        metadata: {
          customer_id: customerId,
          store_id: storeId,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Payment Intent作成に失敗しました');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment Intent作成エラー:', error);
    throw error;
  }
};

// 決済確認
export const confirmPayment = async (clientSecret: string, paymentMethodId: string) => {
  try {
    const stripe = await getStripe();
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return paymentIntent;
  } catch (error) {
    console.error('決済確認エラー:', error);
    throw error;
  }
};

// 店舗のConnected Account情報取得
export const getStoreAccount = async (storeId: string) => {
  try {
    const response = await fetch(`/api/store-account/${storeId}`);
    
    if (!response.ok) {
      throw new Error('店舗アカウント情報の取得に失敗しました');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('店舗アカウント取得エラー:', error);
    throw error;
  }
};