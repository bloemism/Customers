-- ポイントシステム用テーブル作成SQL
-- Supabaseで実行してください

-- 顧客ポイントテーブル
CREATE TABLE IF NOT EXISTS customer_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT UNIQUE,
  customer_email TEXT,
  current_points INTEGER DEFAULT 0 NOT NULL,
  total_earned_points INTEGER DEFAULT 0 NOT NULL,
  total_used_points INTEGER DEFAULT 0 NOT NULL,
  last_transaction_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ポイント取引履歴テーブル
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customer_points(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'use')),
  points INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_customer_points_phone ON customer_points(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_points_email ON customer_points(customer_email);
CREATE INDEX IF NOT EXISTS idx_point_transactions_customer ON point_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_date ON point_transactions(transaction_date);

-- RLS（Row Level Security）の有効化
ALTER TABLE customer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- 基本的なポリシー（必要に応じて調整）
CREATE POLICY "Allow authenticated users to view customer points" ON customer_points
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert customer points" ON customer_points
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update customer points" ON customer_points
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view point transactions" ON point_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert point transactions" ON point_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- サンプルデータ（テスト用）
INSERT INTO customer_points (customer_name, customer_phone, customer_email, current_points, total_earned_points, total_used_points)
VALUES 
  ('田中花子', '090-1234-5678', 'tanaka@example.com', 1500, 3000, 1500),
  ('佐藤太郎', '090-8765-4321', 'sato@example.com', 800, 2000, 1200),
  ('山田美咲', '090-5555-1234', 'yamada@example.com', 2500, 5000, 2500)
ON CONFLICT (customer_phone) DO NOTHING;

-- サンプル取引履歴
INSERT INTO point_transactions (customer_id, transaction_type, points, amount, description)
SELECT 
  cp.id,
  'earn',
  500,
  10000.00,
  '初回購入ボーナス'
FROM customer_points cp
WHERE cp.customer_phone = '090-1234-5678'
ON CONFLICT DO NOTHING;

-- 更新日時を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_customer_points_updated_at 
  BEFORE UPDATE ON customer_points 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ポイント増減用の関数
CREATE OR REPLACE FUNCTION increment_points(row_id UUID, increment_amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT current_points + increment_amount FROM customer_points WHERE id = row_id);
END;
$$ LANGUAGE plpgsql;
