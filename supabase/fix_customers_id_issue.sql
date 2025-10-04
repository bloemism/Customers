-- customersテーブルのid問題を修正

-- 1. 既存のcustomersテーブルを削除（データも含む）
DROP TABLE IF EXISTS customers CASCADE;

-- 2. customersテーブルを正しく作成
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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

-- 3. RLSを無効化（テスト用）
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- 4. テスト用の顧客データを挿入
INSERT INTO customers (user_id, email, name, phone, points, level)
VALUES (
  'a10425fb-db28-4db1-b731-0a5368aa7c06',
  'botanism2011@gmail.com',
  '中三川聖次',
  '09014042509',
  0,
  'BASIC'
);

-- 5. データ確認
SELECT * FROM customers WHERE user_id = 'a10425fb-db28-4db1-b731-0a5368aa7c06';


