-- store-001のデータ構造を確認するSQL
-- このファイルをSupabaseで実行して、現在のデータ構造を確認してください

-- 1. storesテーブルの構造確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;

-- 2. store-001のデータ確認
SELECT * FROM stores WHERE id = 'store-001' OR name LIKE '%store-001%' OR name LIKE '%001%';

-- 3. 全店舗データの確認（最初の5件）
SELECT * FROM stores LIMIT 5;

-- 4. テーブルの制約確認
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'stores';

-- 5. インデックス確認
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'stores';
