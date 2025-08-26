-- Stripeサブスクリプション関連テーブルの作成（最小限版）
-- エラーを避けるための最小限の設定

-- サブスクリプションテーブル（最小限）
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  plan_id TEXT,
  plan_name TEXT,
  plan_price INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 支払い方法テーブル（最小限）
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID,
  stripe_payment_method_id TEXT,
  type TEXT DEFAULT 'card',
  card_brand TEXT,
  card_last4 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 基本的なインデックス
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_store_id ON payment_methods(store_id);

-- RLSを無効化（開発用）
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;

-- サンプルデータ（最小限）
INSERT INTO subscriptions (
  store_id,
  stripe_subscription_id,
  status,
  plan_id,
  plan_name,
  plan_price
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'sub_test_123456789',
  'active',
  'price_1S0JoVQlIIKeUOm9QZYE0n7M',
  '87app 月額プラン',
  5500
) ON CONFLICT (stripe_subscription_id) DO NOTHING;
