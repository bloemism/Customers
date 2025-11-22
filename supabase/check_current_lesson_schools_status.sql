-- 現在のlesson_schoolsテーブルの状況を確認

-- 1. テーブルの存在確認
SELECT 
  'Table Check' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_schools' AND table_schema = 'public') 
    THEN 'lesson_schools table exists' 
    ELSE 'lesson_schools table NOT FOUND' 
  END as result;

-- 2. テーブル構造の確認（テーブルが存在する場合）
SELECT 
  'Structure Check' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 3. データ数の確認
SELECT 
  'Data Count' as status,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_records
FROM lesson_schools;

-- 4. サンプルデータの確認
SELECT 
  'Sample Data' as status,
  id,
  name,
  prefecture,
  city,
  store_email,
  is_active,
  created_at
FROM lesson_schools 
ORDER BY created_at DESC 
LIMIT 3;

-- 5. RLS設定の確認
SELECT 
  'RLS Status' as status,
  tablename,
  rowsecurity,
  hasrls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'lesson_schools';

