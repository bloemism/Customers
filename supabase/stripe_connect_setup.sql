-- Stripe Connect データベース設定
-- 店舗と顧客間の決済処理用テーブル

-- 1. storesテーブルにStripe Connect情報を追加
DO $$
BEGIN
    -- stripe_account_id カラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'stripe_account_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE stores ADD COLUMN stripe_account_id VARCHAR(255);
        RAISE NOTICE 'stripe_account_id カラムを追加しました';
    END IF;

    -- stripe_account_status カラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'stripe_account_status' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE stores ADD COLUMN stripe_account_status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE 'stripe_account_status カラムを追加しました';
    END IF;

    -- stripe_account_verified カラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'stripe_account_verified' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE stores ADD COLUMN stripe_account_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'stripe_account_verified カラムを追加しました';
    END IF;

    -- bank_account_info カラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'bank_account_info' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE stores ADD COLUMN bank_account_info JSONB;
        RAISE NOTICE 'bank_account_info カラムを追加しました';
    END IF;

    -- stripe_connect_enabled カラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'stripe_connect_enabled' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE stores ADD COLUMN stripe_connect_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'stripe_connect_enabled カラムを追加しました';
    END IF;
END $$;

-- 2. 決済取引テーブルの作成
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  amount INTEGER NOT NULL, -- 総額（セント単位）
  platform_fee INTEGER NOT NULL, -- プラットフォーム手数料（セント単位）
  stripe_fee INTEGER NOT NULL, -- Stripe手数料（セント単位）
  store_amount INTEGER NOT NULL, -- 店舗受取額（セント単位）
  currency VARCHAR(3) DEFAULT 'jpy',
  status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, failed, canceled
  payment_method VARCHAR(50), -- card, cash, etc.
  metadata JSONB, -- 追加情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 手数料設定テーブルの作成
CREATE TABLE IF NOT EXISTS fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee_rate DECIMAL(5,4) DEFAULT 0.0300, -- 3.00%
  stripe_fee_rate DECIMAL(5,4) DEFAULT 0.0360, -- 3.60%
  stripe_fixed_fee INTEGER DEFAULT 40, -- 40円固定費
  minimum_fee INTEGER DEFAULT 100, -- 最低手数料100円
  maximum_fee INTEGER DEFAULT 10000, -- 最高手数料10000円
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 店舗決済設定テーブルの作成
CREATE TABLE IF NOT EXISTS store_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  auto_transfer_enabled BOOLEAN DEFAULT true, -- 自動振込有効
  transfer_schedule VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
  minimum_transfer_amount INTEGER DEFAULT 1000, -- 最低振込額1000円
  bank_account_info JSONB, -- 銀行口座情報
  tax_id VARCHAR(50), -- 税務ID
  business_license VARCHAR(100), -- 事業者登録番号
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id)
);

-- 5. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_payment_transactions_store_id ON payment_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent_id ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_store_payment_settings_store_id ON store_payment_settings(store_id);

-- 6. 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fee_settings_updated_at ON fee_settings;
CREATE TRIGGER update_fee_settings_updated_at
  BEFORE UPDATE ON fee_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_payment_settings_updated_at ON store_payment_settings;
CREATE TRIGGER update_store_payment_settings_updated_at
  BEFORE UPDATE ON store_payment_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 手数料計算関数
CREATE OR REPLACE FUNCTION calculate_payment_fees(
  amount_cents INTEGER
) RETURNS TABLE(
  total_amount INTEGER,
  platform_fee INTEGER,
  stripe_fee INTEGER,
  store_amount INTEGER
) AS $$
DECLARE
  fee_setting RECORD;
  calculated_platform_fee INTEGER;
  calculated_stripe_fee INTEGER;
  final_platform_fee INTEGER;
  final_stripe_fee INTEGER;
  final_store_amount INTEGER;
BEGIN
  -- 現在有効な手数料設定を取得
  SELECT * INTO fee_setting
  FROM fee_settings
  WHERE is_active = true
  AND effective_from <= NOW()
  AND (effective_to IS NULL OR effective_to > NOW())
  ORDER BY effective_from DESC
  LIMIT 1;

  -- デフォルト値を使用（設定がない場合）
  IF fee_setting IS NULL THEN
    fee_setting.platform_fee_rate := 0.0300;
    fee_setting.stripe_fee_rate := 0.0360;
    fee_setting.stripe_fixed_fee := 40;
    fee_setting.minimum_fee := 100;
    fee_setting.maximum_fee := 10000;
  END IF;

  -- 手数料計算
  calculated_platform_fee := ROUND(amount_cents * fee_setting.platform_fee_rate);
  calculated_stripe_fee := ROUND(amount_cents * fee_setting.stripe_fee_rate) + fee_setting.stripe_fixed_fee;

  -- 最低・最高手数料の適用
  final_platform_fee := GREATEST(calculated_platform_fee, fee_setting.minimum_fee);
  final_platform_fee := LEAST(final_platform_fee, fee_setting.maximum_fee);

  final_stripe_fee := GREATEST(calculated_stripe_fee, 0);

  -- 店舗受取額計算
  final_store_amount := amount_cents - final_platform_fee - final_stripe_fee;

  -- 結果を返す
  RETURN QUERY SELECT
    amount_cents,
    final_platform_fee,
    final_stripe_fee,
    final_store_amount;
END;
$$ LANGUAGE plpgsql;

-- 8. デフォルト手数料設定の挿入
INSERT INTO fee_settings (
  platform_fee_rate,
  stripe_fee_rate,
  stripe_fixed_fee,
  minimum_fee,
  maximum_fee,
  is_active,
  effective_from
) VALUES (
  0.0300, -- 3.00%
  0.0360, -- 3.60%
  40,     -- 40円固定費
  100,    -- 最低100円
  10000,  -- 最高10000円
  true,
  NOW()
) ON CONFLICT DO NOTHING;

-- 9. RLSポリシーの設定
-- payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 店舗は自身の決済履歴を参照可能
CREATE POLICY "Stores can view their own payment transactions" ON payment_transactions
FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM stores WHERE id = store_id)
);

-- 顧客は自身の決済履歴を参照可能
CREATE POLICY "Customers can view their own payment transactions" ON payment_transactions
FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM customers WHERE id = customer_id)
);

-- store_payment_settings
ALTER TABLE store_payment_settings ENABLE ROW LEVEL SECURITY;

-- 店舗は自身の決済設定を参照・更新可能
CREATE POLICY "Stores can manage their own payment settings" ON store_payment_settings
FOR ALL USING (
  auth.uid() = (SELECT user_id FROM stores WHERE id = store_id)
);

-- fee_settings（読み取り専用）
ALTER TABLE fee_settings ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが手数料設定を参照可能
CREATE POLICY "Everyone can view fee settings" ON fee_settings
FOR SELECT USING (true);

-- 10. 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Stripe Connect データベース設定が完了しました！';
    RAISE NOTICE '追加されたテーブル:';
    RAISE NOTICE '- payment_transactions: 決済取引履歴';
    RAISE NOTICE '- fee_settings: 手数料設定';
    RAISE NOTICE '- store_payment_settings: 店舗決済設定';
    RAISE NOTICE '';
    RAISE NOTICE '追加されたカラム（storesテーブル）:';
    RAISE NOTICE '- stripe_account_id: Stripe Connected Account ID';
    RAISE NOTICE '- stripe_account_status: アカウント状況';
    RAISE NOTICE '- stripe_account_verified: 本人確認済みフラグ';
    RAISE NOTICE '- bank_account_info: 銀行口座情報';
    RAISE NOTICE '- stripe_connect_enabled: Connect機能有効フラグ';
    RAISE NOTICE '';
    RAISE NOTICE '手数料計算関数: calculate_payment_fees(amount_cents)';
    RAISE NOTICE '使用例: SELECT * FROM calculate_payment_fees(10000); -- 100円の決済';
END $$;

