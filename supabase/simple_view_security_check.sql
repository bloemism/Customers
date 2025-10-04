-- シンプルなビューセキュリティチェック

-- 1. 現在の全てのビューを確認
SELECT 
    '現在のビュー一覧' as check_type,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 2. ビューの権限状況
SELECT 
    'ビューの権限' as check_type,
    table_name as view_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
ORDER BY table_name, grantee;

-- 3. payment_method_trends_viewの詳細確認
SELECT 
    'payment_method_trends_view詳細' as check_type,
    schemaname,
    viewname,
    viewowner,
    pg_get_viewdef(oid) as definition
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';

-- 4. 問題のある可能性のあるビューを特定
SELECT 
    '要確認のビュー' as check_type,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND (
    viewname LIKE '%payment%' OR
    viewname LIKE '%trends%' OR
    viewname LIKE '%analytics%' OR
    viewname LIKE '%stats%' OR
    viewname LIKE '%report%'
  )
ORDER BY viewname;
