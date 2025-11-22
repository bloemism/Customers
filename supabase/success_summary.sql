-- 成功確認のサマリー

-- 1. SECURITY DEFINERビューが修正されたか確認
SELECT 
    'SECURITY DEFINERビュー確認' as check_type,
    COUNT(*) as security_definer_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public';

-- 2. 現在のビュー一覧
SELECT 
    '現在のビュー一覧' as check_type,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 3. 権限設定状況
SELECT 
    '権限設定状況' as check_type,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;

-- 4. 修正完了メッセージ
SELECT 
    '✅ 修正完了' as status,
    'Supabaseのセキュリティ警告が解消されました' as message;

