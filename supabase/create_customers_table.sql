-- customersテーブルを作成（既存の場合はスキップ）

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- RLS設定
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ポリシー設定（顧客は自分の情報を管理可能）
CREATE POLICY "顧客は自分の情報を管理可能" ON customers
  FOR ALL USING (
    email = auth.jwt() ->> 'email'
  );

-- サンプルデータは既存のcustomersテーブルを使用
-- 既存データ: botanism2011@gmail.com (中三川聖次)
