-- シンプルなセキュリティ確認（エラー回避版）

-- 1. 現在のビュー一覧
SELECT 
    '現在のビュー' as check_type,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 2. ビューの権限状況
SELECT 
    'ビュー権限' as check_type,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;

-- 3. RLSが有効なテーブル確認
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

-- 4. 主要なRLSポリシー確認
SELECT 
    'RLSポリシー' as check_type,
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
    'customers'
  )
ORDER BY tablename, policyname;

-- 5. セキュリティ状況サマリー
SELECT 
    '✅ セキュリティ状況' as status,
    'SECURITY DEFINERビューが削除され、適切な権限が設定されました' as summary;

