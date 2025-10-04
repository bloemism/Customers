-- 最終確認（列名エラー修正版）

-- 1. ビュー作成の確認
SELECT 
    'ビュー確認' as check_type,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';

-- 2. 権限設定の確認（修正版）
SELECT 
    '権限確認' as check_type,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'payment_method_trends_view'
ORDER BY table_name, grantee;

-- 3. 全てのビューの権限状況確認
SELECT 
    '全ビュー権限' as check_type,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND grantee = 'authenticated'
ORDER BY table_name;
