-- フラワーレッスンマップとレッスンスクール管理の紐付け問題のデバッグ

-- 1. テーブルの存在確認
SELECT 
  'Table Existence Check' as check_type,
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('lesson_schools', 'lesson_schedules', 'region_categories')
ORDER BY table_name;

-- 2. lesson_schoolsテーブルの構造確認
SELECT 
  'lesson_schools Structure' as check_type,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 3. 既存データの確認
SELECT 
  'lesson_schools Data Count' as check_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM lesson_schools;

-- 4. サンプルデータの確認（最初の5件）
SELECT 
  'Sample Data' as check_type,
  id,
  name,
  prefecture,
  city,
  latitude,
  longitude,
  is_active,
  created_at
FROM lesson_schools 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. RLS設定の確認
SELECT 
  'RLS Settings' as check_type,
  schemaname, 
  tablename, 
  rowsecurity, 
  hasrls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'lesson_schools';

-- 6. RLSポリシーの確認
SELECT 
  'RLS Policies' as check_type,
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'lesson_schools'
ORDER BY policyname;

-- 7. 地域分類データの確認
SELECT 
  'Region Categories' as check_type,
  COUNT(*) as total_count
FROM region_categories;

-- 8. エラーの可能性があるデータの確認
SELECT 
  'Data Issues' as check_type,
  COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as missing_coordinates,
  COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as missing_names,
  COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as missing_emails
FROM lesson_schools;
