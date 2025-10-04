-- 既存のテーブル構造を確認
-- 顧客関連のテーブルとカラムを特定

-- 1. 全てのテーブル一覧
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. 顧客関連のテーブルを検索
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%customer%' OR table_name LIKE '%user%')
ORDER BY table_name, ordinal_position;

-- 3. 認証関連のテーブル
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%auth%' OR table_name LIKE '%profile%')
ORDER BY table_name, ordinal_position;

-- 4. 店舗関連のテーブル
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%store%' OR table_name LIKE '%lesson%')
ORDER BY table_name, ordinal_position;


