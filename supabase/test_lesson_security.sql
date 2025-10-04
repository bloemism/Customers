-- レッスン関連テーブルのセキュリティテスト

-- 1. 匿名ユーザーでアクセステスト（基本情報のみ取得可能であることを確認）
-- このテストは実際のSupabaseクライアントで行う必要があります

-- 2. 認証ユーザーでアクセステスト（自分のデータのみ取得可能であることを確認）

-- 3. テーブルアクセス権限の確認
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name IN (
    'lesson_schools', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions'
  )
ORDER BY table_name, grantee;

-- 4. 現在のRLS状況確認
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'lesson_schools', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions'
  );

-- 5. ポリシーの詳細確認
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'lesson_schools', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions'
  )
ORDER BY tablename, policyname;
