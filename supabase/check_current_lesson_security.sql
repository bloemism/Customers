-- 現在のレッスン関連テーブルのセキュリティ状況を確認

-- 1. テーブルの存在確認
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'lesson_schools', 
    'lesson_schedules', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions'
  )
ORDER BY table_name;

-- 2. RLSの有効/無効状況確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'lesson_schools', 
    'lesson_schedules', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions'
  )
ORDER BY tablename;

-- 3. 既存のポリシー確認
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
  AND tablename IN (
    'lesson_schools', 
    'lesson_schedules', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions'
  )
ORDER BY tablename, policyname;

-- 4. テーブル構造確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN (
    'lesson_schools', 
    'lesson_schedules', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions'
  )
ORDER BY table_name, ordinal_position;
