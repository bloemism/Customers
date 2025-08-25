import { loadStripe } from '@stripe/stripe-js';

// Stripe公開キー（環境変数から取得）
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

console.log('Stripe公開キー:', stripePublishableKey ? '設定済み' : '未設定');

if (!stripePublishableKey) {
  console.warn('Stripe公開キーが設定されていません。環境変数 VITE_STRIPE_PUBLISHABLE_KEY を設定してください。');
}

// Stripeインスタンスの初期化
export const stripePromise = loadStripe(stripePublishableKey || '');

// 月額プランの商品ID（定額制）
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: {
    id: 'price_1Rp9I8QlIIKeUOm9jjn3oygt', // 実際のStripe商品ID
    name: '87app 月額プラン',
    price: 5500, // 税込
    features: [
      '商品管理（無制限）',
      '顧客管理（高度な分析）',
      'QR決済システム',
      'フラワーレッスン管理',
      '人気ランキング',
      '詳細レポート',
      '店舗マップ掲載',
      '画像・掲示板・タグ機能',
      '優先サポート',
      '顧客決済手数料3%収益'
    ]
  }
};

// 顧客決済手数料設定
export const CUSTOMER_PAYMENT_FEE = {
  percentage: 3, // 3%
  description: '決済手数料（3%）'
};

// 決済関連の型定義
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  stripePriceId: string;
}

export interface SubscriptionStatus {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  planId: string;
  planName: string;
  planPrice: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}
