-- Stripe Connect Setup for 87app
-- 店舗向けStripe Connect機能の実装

-- 1. storesテーブルにStripe Connect情報を追加
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_account_status VARCHAR(50) DEFAULT 'not_created',
ADD COLUMN IF NOT EXISTS stripe_account_type VARCHAR(20) DEFAULT 'express',
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_account_info JSONB,
ADD COLUMN IF NOT EXISTS stripe_updated_at TIMESTAMP WITH TIME ZONE;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_stores_stripe_account_id ON stores(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_stores_stripe_account_status ON stores(stripe_account_status);

-- 2. 決済トランザクションテーブルの作成
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT REFERENCES stores(id),
  customer_id UUID,
  payment_code VARCHAR(5),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_transfer_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'jpy',
  platform_fee INTEGER DEFAULT 0,
  stripe_fee INTEGER DEFAULT 0,
  store_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'card',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_payment_transactions_store_id ON payment_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_code ON payment_transactions(payment_code);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent_id ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- 3. 店舗売上サマリーテーブルの作成
CREATE TABLE IF NOT EXISTS store_revenue_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT REFERENCES stores(id),
  date DATE NOT NULL,
  total_sales INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  platform_fees INTEGER DEFAULT 0,
  stripe_fees INTEGER DEFAULT 0,
  net_revenue INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, date)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_store_revenue_summary_store_id ON store_revenue_summary(store_id);
CREATE INDEX IF NOT EXISTS idx_store_revenue_summary_date ON store_revenue_summary(date);

-- 4. RLSポリシーの設定

-- payment_transactionsテーブルのRLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 公開読み取りアクセス（テスト用）
DROP POLICY IF EXISTS "Allow public read access" ON payment_transactions;
CREATE POLICY "Allow public read access" ON payment_transactions FOR SELECT USING (true);

-- 認証済みユーザーが挿入可能
DROP POLICY IF EXISTS "Allow authenticated insert access" ON payment_transactions;
CREATE POLICY "Allow authenticated insert access" ON payment_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 認証済みユーザーが更新可能
DROP POLICY IF EXISTS "Allow authenticated update access" ON payment_transactions;
CREATE POLICY "Allow authenticated update access" ON payment_transactions FOR UPDATE USING (true) WITH CHECK (true);

-- store_revenue_summaryテーブルのRLS
ALTER TABLE store_revenue_summary ENABLE ROW LEVEL SECURITY;

-- 公開読み取りアクセス
DROP POLICY IF EXISTS "Allow public read access" ON store_revenue_summary;
CREATE POLICY "Allow public read access" ON store_revenue_summary FOR SELECT USING (true);

-- 認証済みユーザーが挿入可能
DROP POLICY IF EXISTS "Allow authenticated insert access" ON store_revenue_summary;
CREATE POLICY "Allow authenticated insert access" ON store_revenue_summary FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 認証済みユーザーが更新可能
DROP POLICY IF EXISTS "Allow authenticated update access" ON store_revenue_summary;
CREATE POLICY "Allow authenticated update access" ON store_revenue_summary FOR UPDATE USING (true) WITH CHECK (true);

-- 5. 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_store_revenue_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- 決済が成功した場合のみ集計
  IF NEW.status = 'succeeded' THEN
    INSERT INTO store_revenue_summary (
      store_id,
      date,
      total_sales,
      total_transactions,
      platform_fees,
      stripe_fees,
      net_revenue
    )
    VALUES (
      NEW.store_id,
      DATE(NEW.created_at),
      NEW.amount,
      1,
      NEW.platform_fee,
      NEW.stripe_fee,
      NEW.store_amount
    )
    ON CONFLICT (store_id, date)
    DO UPDATE SET
      total_sales = store_revenue_summary.total_sales + NEW.amount,
      total_transactions = store_revenue_summary.total_transactions + 1,
      platform_fees = store_revenue_summary.platform_fees + NEW.platform_fee,
      stripe_fees = store_revenue_summary.stripe_fees + NEW.stripe_fee,
      net_revenue = store_revenue_summary.net_revenue + NEW.store_amount,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
DROP TRIGGER IF EXISTS trigger_update_store_revenue_summary ON payment_transactions;
CREATE TRIGGER trigger_update_store_revenue_summary
AFTER INSERT OR UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_store_revenue_summary();

-- 6. 便利な関数

-- 店舗の売上統計を取得
CREATE OR REPLACE FUNCTION get_store_revenue_stats(
  p_store_id TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_sales BIGINT,
  total_transactions BIGINT,
  total_platform_fees BIGINT,
  total_stripe_fees BIGINT,
  total_net_revenue BIGINT,
  average_transaction_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(total_sales), 0)::BIGINT,
    COALESCE(SUM(total_transactions), 0)::BIGINT,
    COALESCE(SUM(platform_fees), 0)::BIGINT,
    COALESCE(SUM(stripe_fees), 0)::BIGINT,
    COALESCE(SUM(net_revenue), 0)::BIGINT,
    CASE 
      WHEN SUM(total_transactions) > 0 
      THEN ROUND(SUM(total_sales)::NUMERIC / SUM(total_transactions), 2)
      ELSE 0
    END
  FROM store_revenue_summary
  WHERE store_id = p_store_id
    AND (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- 7. テストデータ確認用ビュー
CREATE OR REPLACE VIEW store_payment_overview AS
SELECT
  s.id AS store_id,
  s.name AS store_name,
  s.stripe_account_id,
  s.stripe_account_status,
  s.stripe_charges_enabled,
  s.stripe_payouts_enabled,
  COUNT(pt.id) AS total_transactions,
  COALESCE(SUM(pt.amount), 0) AS total_sales,
  COALESCE(SUM(pt.platform_fee), 0) AS total_platform_fees,
  COALESCE(SUM(pt.store_amount), 0) AS total_net_revenue
FROM stores s
LEFT JOIN payment_transactions pt ON s.id = pt.store_id AND pt.status = 'succeeded'
GROUP BY s.id, s.name, s.stripe_account_id, s.stripe_account_status, s.stripe_charges_enabled, s.stripe_payouts_enabled;

COMMENT ON TABLE payment_transactions IS 'Stripe Connect決済トランザクション履歴';
COMMENT ON TABLE store_revenue_summary IS '店舗別日次売上サマリー';
COMMENT ON VIEW store_payment_overview IS '店舗別決済概要ビュー';
