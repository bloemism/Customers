import { loadStripe } from '@stripe/stripe-js';

// Stripe設定
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Rp9I8QlIIKeUOm9jjn3oygt';

// 利用可能な機能の定義
export const AVAILABLE_FEATURES = {
  CUSTOMER_CHECKOUT: 'お客様会計',
  PRODUCT_MANAGEMENT: '商品管理',
  FLORIST_MAP: '全国フローリストマップ',
  CUSTOMER_MANAGEMENT: '顧客管理',
  STORE_DATA_MANAGEMENT: '店舗データ管理',
  FLOWER_LESSON_MAP: 'フラワーレッスンマップ',
  LESSON_SCHOOL_MANAGEMENT: 'レッスンスクール管理',
  LESSON_SCHEDULE_MANAGEMENT: 'レッスンスケジュール管理',
  POPULARITY_RANKINGS: '人気ランキング'
} as const;

export type FeatureKey = keyof typeof AVAILABLE_FEATURES;

// サブスクリプション商品情報
export const SUBSCRIPTION_PRODUCTS = {
  FLORIST: {
    id: 'prod_florist_registration',
    name: 'フローリスト登録',
    description: '花屋としての登録プラン（全機能利用可能）',
    price: 5500,
    stripePriceId: 'price_1S0JoVQlIIKeUOm9QZYE0n7M',
    paymentLink: 'https://buy.stripe.com/dRm4gB7YjdMA6wY4q78Ra01',
    features: [
      'CUSTOMER_CHECKOUT',
      'PRODUCT_MANAGEMENT',
      'FLORIST_MAP',
      'CUSTOMER_MANAGEMENT',
      'STORE_DATA_MANAGEMENT',
      'FLOWER_LESSON_MAP',
      'LESSON_SCHOOL_MANAGEMENT',
      'LESSON_SCHEDULE_MANAGEMENT',
      'POPULARITY_RANKINGS'
    ] as FeatureKey[]
  },
  FLOWER_SCHOOL: {
    id: 'prod_flower_school_registration',
    name: 'フラワースクール登録',
    description: 'フラワースクールとしての登録プラン（一部機能のみ）',
    price: 3300,
    stripePriceId: 'price_flower_school',
    paymentLink: 'https://buy.stripe.com/14A14p0vR9wk3kM09R8Ra03',
    features: [
      'FLORIST_MAP',
      'CUSTOMER_MANAGEMENT',
      'FLOWER_LESSON_MAP',
      'LESSON_SCHOOL_MANAGEMENT',
      'LESSON_SCHEDULE_MANAGEMENT',
      'POPULARITY_RANKINGS'
    ]
  }
};

// プラン別の機能制限をチェックする関数
export const checkFeatureAccess = (
  userPlan: keyof typeof SUBSCRIPTION_PRODUCTS | null,
  feature: FeatureKey
): boolean => {
  if (!userPlan) return false;
  
  const plan = SUBSCRIPTION_PRODUCTS[userPlan];
  return plan.features.includes(feature);
};

// テスト用Stripe Price ID
export const TEST_STRIPE_PRICE_ID = 'price_1S0JoVQlIIKeUOm9QZYE0n7M';

// Stripe商品情報
export const STRIPE_PRODUCT_INFO = {
  priceId: 'price_1S0JoVQlIIKeUOm9QZYE0n7M',
  productId: 'prod_SwCCAXplRDcZly'
};

// Stripe初期化
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

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
