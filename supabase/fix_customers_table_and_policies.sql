-- customersテーブルとRLSポリシーの修正

-- 1. 現在のcustomersテーブル構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- 2. 現在のRLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'customers';

-- 3. customersテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  alphabet VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  birth_date DATE,
  points INTEGER DEFAULT 0,
  level VARCHAR(20) DEFAULT 'BASIC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "customers_can_view_own_data" ON customers;
DROP POLICY IF EXISTS "customers_can_modify_own_data" ON customers;
DROP POLICY IF EXISTS "users_own_customer_data" ON customers;

-- 5. RLSを有効化
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 6. 新しいRLSポリシーを作成
-- 顧客は自分のデータのみアクセス可能
CREATE POLICY "customers_own_data_policy" ON customers
  FOR ALL USING (auth.uid() = user_id);

-- 7. インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 8. 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at();

-- 9. 既存の顧客データを確認
SELECT COUNT(*) as customer_count FROM customers;


