-- スキーマ不整合の修正
-- 87app Flower Shop Management System

-- 1. 現在のテーブル構造を確認
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'customers') 
AND column_name LIKE '%point%'
ORDER BY table_name, column_name;

-- 2. customersテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  birth_date DATE,
  gender VARCHAR(20),
  current_points INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_purchase_amount INTEGER DEFAULT 0,
  first_purchase_date TIMESTAMP WITH TIME ZONE,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. customersテーブルにtotal_pointsカラムが存在しない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'total_points'
    ) THEN
        ALTER TABLE customers ADD COLUMN total_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. current_pointsカラムが存在しない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'current_points'
    ) THEN
        ALTER TABLE customers ADD COLUMN current_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- 5. total_points_earnedカラムが存在しない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'total_points_earned'
    ) THEN
        ALTER TABLE customers ADD COLUMN total_points_earned INTEGER DEFAULT 0;
    END IF;
END $$;

-- 6. user_idカラムが存在しない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. 既存のtotal_pointsデータをcurrent_pointsに同期
UPDATE customers 
SET current_points = total_points 
WHERE current_points = 0 AND total_points > 0;

-- 8. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_points ON customers(current_points DESC);
CREATE INDEX IF NOT EXISTS idx_customers_total_points ON customers(total_points DESC);

-- 9. RLS (Row Level Security) の設定
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 10. RLSポリシーの作成
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
CREATE POLICY "Customers can view own data" ON customers 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can update own data" ON customers;
CREATE POLICY "Customers can update own data" ON customers 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can insert own data" ON customers;
CREATE POLICY "Customers can insert own data" ON customers 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. 更新日時の自動更新用トリガー
CREATE OR REPLACE FUNCTION update_customers_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at_column();

-- 12. 修正後のテーブル構造を確認
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name LIKE '%point%'
ORDER BY column_name;

-- 13. 完了メッセージ
SELECT 'スキーマ不整合の修正が完了しました。' as message;
