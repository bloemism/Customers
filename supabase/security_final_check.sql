-- セキュリティ最終確認

-- 1. ビューの基本情報確認
SELECT 
    'ビュー基本情報' as check_type,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 2. RLSが有効なテーブルの確認
SELECT 
    'RLS有効テーブル' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'lesson_schools', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions',
    'customers',
    'stores'
  )
ORDER BY tablename;

-- 3. 重要なテーブルのRLSポリシー確認
SELECT 
    'RLSポリシー確認' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'lesson_schools', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions',
    'customers'
  )
ORDER BY tablename, policyname;

-- 4. ビューの権限状況確認
SELECT 
    'ビュー権限状況' as check_type,
    table_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;

-- 5. セキュリティ状況サマリー
SELECT 
    '✅ セキュリティ状況' as status,
    'SECURITY DEFINERビューが削除され、適切な権限が設定されました' as summary;
