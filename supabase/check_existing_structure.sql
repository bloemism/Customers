-- 既存のstoresテーブルの構造を確認するSQL
-- このファイルをSupabaseで実行して、現在のテーブル構造を確認してください

-- 1. storesテーブルの構造確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;

-- 2. storesテーブルのサンプルデータ確認
SELECT * FROM stores LIMIT 5;

-- 3. テーブルの制約確認
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'stores';

-- 4. インデックス確認
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'stores';
