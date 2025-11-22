-- SECURITY DEFINERビューの確認

-- 1. SECURITY DEFINERプロパティを持つビューを検索
SELECT 
    schemaname,
    viewname,
    definition,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname LIKE '%payment_method_trends_view%'
ORDER BY viewname;

-- 2. 全てのSECURITY DEFINERビューを検索
SELECT 
    n.nspname as schema_name,
    c.relname as view_name,
    pg_get_viewdef(c.oid) as view_definition,
    c.relowner::regrole as view_owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND EXISTS (
    SELECT 1 
    FROM pg_rewrite r
    WHERE r.ev_class = c.oid
      AND r.ev_security_definer = 't'
  )
ORDER BY c.relname;

-- 3. ビューの詳細情報（権限設定含む）
SELECT 
    schemaname,
    viewname,
    viewowner,
    pg_get_viewdef(oid) as definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 4. ビューの権限情報
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name LIKE '%payment_method_trends_view%';
