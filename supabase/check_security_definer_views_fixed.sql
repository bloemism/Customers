-- SECURITY DEFINERビューの確認（修正版）

-- 1. 基本的なビュー情報確認
SELECT 
    schemaname,
    viewname,
    viewowner,
    pg_get_viewdef(oid) as definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 2. ビューの権限情報確認
SELECT 
    table_name as view_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
ORDER BY table_name, grantee;

-- 3. SECURITY DEFINERビューを検索（互換性の高い方法）
-- PostgreSQLのバージョンに応じて適切な方法を使用
WITH view_info AS (
    SELECT 
        n.nspname as schema_name,
        c.relname as view_name,
        c.oid as view_oid,
        pg_get_viewdef(c.oid) as view_definition
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND n.nspname = 'public'
),
rewrite_info AS (
    SELECT 
        r.ev_class as view_oid,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_attribute a 
                WHERE a.attrelid = 'pg_rewrite'::regclass 
                  AND a.attname = 'ev_security_definer'
            ) THEN 
                (SELECT r2.ev_security_definer FROM pg_rewrite r2 WHERE r2.oid = r.oid)
            ELSE false
        END as is_security_definer
    FROM pg_rewrite r
    WHERE r.ev_type = '1' -- SELECTルールのみ
)
SELECT 
    vi.schema_name,
    vi.view_name,
    CASE 
        WHEN ri.is_security_definer THEN 'SECURITY DEFINER'
        ELSE '通常のビュー'
    END as security_type,
    vi.view_definition
FROM view_info vi
LEFT JOIN rewrite_info ri ON vi.view_oid = ri.view_oid
ORDER BY security_type, vi.view_name;

-- 4. 簡易版：ビュー名から推測される問題のあるビューを確認
SELECT 
    '推奨: 手動確認が必要' as note,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND (
    viewname LIKE '%trends%' OR
    viewname LIKE '%stats%' OR
    viewname LIKE '%analytics%' OR
    viewname LIKE '%report%'
  )
ORDER BY viewname;
