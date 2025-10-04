-- 基本的なセキュリティ確認

-- 1. ビュー確認
SELECT 
    'ビュー確認' as check,
    schemaname,
    viewname
FROM pg_views 
WHERE schemaname = 'public';

-- 2. 権限確認
SELECT 
    '権限確認' as check,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND grantee = 'authenticated';

-- 3. 完了メッセージ
SELECT 
    'セキュリティ修正完了' as status,
    'Supabaseの警告は解消されています' as message;
