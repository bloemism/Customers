-- customersテーブルの構造を詳細確認

-- 1. customersテーブルの全カラムを確認
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. customersテーブルの主キーを確認
SELECT 
  kcu.column_name,
  kcu.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'customers' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY';

-- 3. customersテーブルの外部キーを確認
SELECT 
  kcu.column_name,
  kcu.constraint_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'customers' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY';

