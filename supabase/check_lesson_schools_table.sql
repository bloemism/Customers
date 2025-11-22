-- lesson_schoolsテーブルの存在確認とRLS設定チェック

-- テーブルの存在確認
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('lesson_schools', 'lesson_schedules', 'student_reservations', 'region_categories')
ORDER BY table_name;

-- lesson_schoolsテーブルの構造確認
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- RLS設定の確認
SELECT 
  schemaname, 
  tablename, 
  rowsecurity, 
  hasrls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('lesson_schools', 'lesson_schedules', 'student_reservations', 'region_categories');

-- RLSポリシーの確認
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('lesson_schools', 'lesson_schedules', 'student_reservations', 'region_categories')
ORDER BY tablename, policyname;

-- 既存データの確認
SELECT COUNT(*) as lesson_schools_count FROM lesson_schools;
SELECT COUNT(*) as lesson_schedules_count FROM lesson_schedules;
SELECT COUNT(*) as student_reservations_count FROM student_reservations;
SELECT COUNT(*) as region_categories_count FROM region_categories;
