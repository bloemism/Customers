-- Payment Codes Setup for 87app
-- 決済コードシステム用のデータベーススキーマ

-- 1. payment_codesテーブル（5桁: 基本決済・5分間有効）
CREATE TABLE IF NOT EXISTS payment_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(5) UNIQUE NOT NULL,
    store_id UUID NOT NULL,
    payment_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. payment_codes_2テーブル（6桁: 遠距離決済・1ヶ月有効）
CREATE TABLE IF NOT EXISTS payment_codes_2 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(6) UNIQUE NOT NULL,
    store_id UUID NOT NULL,
    payment_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. cash_paymentsテーブル（現金決済記録・売上の3%手数料を記録）
CREATE TABLE IF NOT EXISTS cash_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_code VARCHAR(10) NOT NULL, -- 5桁または6桁の決済コード
    store_id UUID NOT NULL,
    customer_id UUID REFERENCES customers(id),
    total_amount INTEGER NOT NULL, -- 総額
    fee_amount INTEGER NOT NULL, -- 手数料（3%）
    payment_data JSONB NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_payment_codes_code ON payment_codes(code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_store_id ON payment_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_expires_at ON payment_codes(expires_at);

CREATE INDEX IF NOT EXISTS idx_payment_codes_2_code ON payment_codes_2(code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_2_store_id ON payment_codes_2(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_2_expires_at ON payment_codes_2(expires_at);

CREATE INDEX IF NOT EXISTS idx_cash_payments_store_id ON cash_payments(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_payments_customer_id ON cash_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_cash_payments_created_at ON cash_payments(created_at);

-- RLS (Row Level Security) の設定
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_codes_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_payments ENABLE ROW LEVEL SECURITY;

-- ポリシーの設定（店舗は自分のコードを閲覧可能、顧客はコード検証のみ可能）
CREATE POLICY "Store owners can view own payment codes" ON payment_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = payment_codes.store_id 
            AND stores.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Store owners can insert own payment codes" ON payment_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = payment_codes.store_id 
            AND stores.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Anyone can verify payment codes" ON payment_codes
    FOR SELECT USING (true); -- コード検証は誰でも可能

CREATE POLICY "Store owners can view own payment codes_2" ON payment_codes_2
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = payment_codes_2.store_id 
            AND stores.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Store owners can insert own payment codes_2" ON payment_codes_2
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = payment_codes_2.store_id 
            AND stores.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Anyone can verify payment codes_2" ON payment_codes_2
    FOR SELECT USING (true); -- コード検証は誰でも可能

CREATE POLICY "Store owners can view own cash payments" ON cash_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = cash_payments.store_id 
            AND stores.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Anyone can insert cash payments" ON cash_payments
    FOR INSERT WITH CHECK (true); -- 現金決済記録は誰でも可能

