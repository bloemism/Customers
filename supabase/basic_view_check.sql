-- 基本的なビュー確認スクリプト（構文エラー修正版）

-- 1. 現在のビュー一覧を表示
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 2. ビューの権限情報
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
ORDER BY table_name, grantee;

-- 3. payment_method_trends_viewの詳細
SELECT 
    schemaname,
    viewname,
    viewowner,
    pg_get_viewdef(oid) as definition
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';
