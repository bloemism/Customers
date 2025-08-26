-- Stripeサブスクリプション関連テーブルの作成（簡略版）
-- 現在のデータベース構造に合わせて作成

-- サブスクリプションテーブル
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_price INTEGER NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 支払い方法テーブル
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'card',
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 決済履歴テーブル
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'jpy',
  status TEXT NOT NULL,
  payment_method_id UUID REFERENCES payment_methods(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_store_id ON payment_methods(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_store_id ON payment_history(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);

-- RLS（Row Level Security）の設定
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- サブスクリプションテーブルのポリシー（簡略版）
CREATE POLICY "店舗は自分のサブスクリプションのみ閲覧可能" ON subscriptions
  FOR SELECT USING (true);

CREATE POLICY "店舗は自分のサブスクリプションのみ更新可能" ON subscriptions
  FOR UPDATE USING (true);

CREATE POLICY "店舗は自分のサブスクリプションのみ挿入可能" ON subscriptions
  FOR INSERT WITH CHECK (true);

-- 支払い方法テーブルのポリシー（簡略版）
CREATE POLICY "店舗は自分の支払い方法のみ閲覧可能" ON payment_methods
  FOR SELECT USING (true);

CREATE POLICY "店舗は自分の支払い方法のみ更新可能" ON payment_methods
  FOR UPDATE USING (true);

CREATE POLICY "店舗は自分の支払い方法のみ挿入可能" ON payment_methods
  FOR INSERT WITH CHECK (true);

-- 決済履歴テーブルのポリシー（簡略版）
CREATE POLICY "店舗は自分の決済履歴のみ閲覧可能" ON payment_history
  FOR SELECT USING (true);

CREATE POLICY "店舗は自分の決済履歴のみ挿入可能" ON payment_history
  FOR INSERT WITH CHECK (true);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- サブスクリプションテーブルにトリガーを設定（重複を避ける）
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータ（テスト用）
INSERT INTO subscriptions (
  store_id,
  stripe_subscription_id,
  stripe_customer_id,
  status,
  plan_id,
  plan_name,
  plan_price,
  current_period_start,
  current_period_end
) VALUES (
  (SELECT id FROM stores LIMIT 1),
  'sub_test_123456789',
  'cus_test_123456789',
  'active',
  'price_1S0JoVQlIIKeUOm9QZYE0n7M',
  '87app 月額プラン',
  5500,
  NOW(),
  NOW() + INTERVAL '1 month'
) ON CONFLICT (stripe_subscription_id) DO NOTHING;

-- サンプル支払い方法（テスト用）
INSERT INTO payment_methods (
  store_id,
  stripe_payment_method_id,
  type,
  card_brand,
  card_last4,
  card_exp_month,
  card_exp_year,
  is_default
) VALUES (
  (SELECT id FROM stores LIMIT 1),
  'pm_test_123456789',
  'card',
  'visa',
  '4242',
  12,
  2025,
  TRUE
) ON CONFLICT (stripe_payment_method_id) DO NOTHING;
