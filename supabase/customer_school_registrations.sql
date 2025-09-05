-- 顧客とスクールの登録関係を管理するテーブル
-- 複数のスクールに登録できる多対多関係

-- 既存のテーブルが存在する場合は削除
DROP TABLE IF EXISTS customer_school_registrations CASCADE;

-- 顧客スクール登録テーブルを作成
CREATE TABLE customer_school_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lesson_school_id UUID NOT NULL REFERENCES lesson_schools(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 一つの顧客が同じスクールに重複登録できないように制約
    UNIQUE(customer_id, lesson_school_id)
);

-- インデックスを作成
CREATE INDEX idx_customer_school_registrations_customer_id ON customer_school_registrations(customer_id);
CREATE INDEX idx_customer_school_registrations_school_id ON customer_school_registrations(lesson_school_id);
CREATE INDEX idx_customer_school_registrations_active ON customer_school_registrations(is_active);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_customer_school_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_school_registrations_updated_at
    BEFORE UPDATE ON customer_school_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_school_registrations_updated_at();

-- Row Level Security (RLS) を有効化
ALTER TABLE customer_school_registrations ENABLE ROW LEVEL SECURITY;

-- 顧客は自分の登録情報のみ閲覧・編集可能
CREATE POLICY "Customers can view own registrations" ON customer_school_registrations
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert own registrations" ON customer_school_registrations
    FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own registrations" ON customer_school_registrations
    FOR UPDATE USING (customer_id = auth.uid());

-- 店舗は自分のスクールの登録情報を閲覧可能
CREATE POLICY "Stores can view their school registrations" ON customer_school_registrations
    FOR SELECT USING (
        lesson_school_id IN (
            SELECT id FROM lesson_schools 
            WHERE store_email = auth.jwt() ->> 'email'
        )
    );

-- 店舗は自分のスクールへの登録を作成可能（QRコードスキャン時）
CREATE POLICY "Stores can create registrations for their schools" ON customer_school_registrations
    FOR INSERT WITH CHECK (
        lesson_school_id IN (
            SELECT id FROM lesson_schools 
            WHERE store_email = auth.jwt() ->> 'email'
        )
    );

-- 店舗は自分のスクールの登録を更新可能
CREATE POLICY "Stores can update their school registrations" ON customer_school_registrations
    FOR UPDATE USING (
        lesson_school_id IN (
            SELECT id FROM lesson_schools 
            WHERE store_email = auth.jwt() ->> 'email'
        )
    );

