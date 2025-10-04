-- テーブルの型不一致を修正
-- 既存のテーブル構造を確認して適切な型に修正

-- 1. 既存のテーブル構造を確認
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('stores', 'lessons', 'customers')
ORDER BY table_name, ordinal_position;

-- 2. storesテーブルのidカラムの型を確認
SELECT 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'stores' AND column_name = 'id';

-- 3. lessonsテーブルのidカラムの型を確認
SELECT 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lessons' AND column_name = 'id';

-- 4. customersテーブルのidカラムの型を確認
SELECT 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'id';

