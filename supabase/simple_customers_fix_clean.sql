-- 簡単なcustomersテーブル修正（クリーン版）

-- 1. 既存のRLSポリシーを全て削除
DROP POLICY IF EXISTS "customers_can_view_own_data" ON customers;
DROP POLICY IF EXISTS "customers_can_modify_own_data" ON customers;
DROP POLICY IF EXISTS "users_own_customer_data" ON customers;
DROP POLICY IF EXISTS "customers_own_data_policy" ON customers;

-- 2. customersテーブルが存在しない場合は作成
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. RLSを一旦無効化（テスト用）
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- 4. 既存のcustomersテーブルにuser_idのUNIQUE制約を追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'customers_user_id_key' 
    AND table_name = 'customers'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 5. テスト用の顧客データを挿入（既存のユーザー用）
INSERT INTO customers (user_id, email, name, phone, points, level)
VALUES (
  'a10425fb-db28-4db1-b731-0a5368aa7c06',
  'botanism2011@gmail.com',
  '中三川聖次',
  '09014042509',
  0,
  'BASIC'
) ON CONFLICT (user_id) DO NOTHING;

-- 6. データ確認
SELECT * FROM customers WHERE user_id = 'a10425fb-db28-4db1-b731-0a5368aa7c06';

