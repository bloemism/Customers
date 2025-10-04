-- セキュアなビュー管理のための包括的なスクリプト

-- 1. 現在のビューの状況を詳細確認
WITH security_definer_views AS (
    SELECT 
        n.nspname as schema_name,
        c.relname as view_name,
        c.relowner::regrole as view_owner,
        pg_get_viewdef(c.oid) as view_definition
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND n.nspname = 'public'
      AND EXISTS (
        SELECT 1 
        FROM pg_rewrite r
        WHERE r.ev_class = c.oid
          AND r.ev_security_definer = true
      )
)
SELECT 
    'SECURITY DEFINERビュー' as view_type,
    schema_name,
    view_name,
    view_owner
FROM security_definer_views
UNION ALL
SELECT 
    '通常のビュー' as view_type,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname NOT IN (
    SELECT view_name FROM security_definer_views
  )
ORDER BY view_type, view_name;

-- 2. ビューの権限状況確認
SELECT 
    table_name as view_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
ORDER BY table_name, grantee, privilege_type;

-- 3. セキュアなビュー作成のテンプレート
/*
-- セキュアなビューの作成パターン:

-- パターン1: RLSが有効なテーブルからのビュー（推奨）
CREATE VIEW public.secure_view_name AS
SELECT 
    column1,
    column2,
    aggregated_data
FROM public.base_table_with_rls 
WHERE condition_for_security
GROUP BY column1, column2;

-- 権限設定
GRANT SELECT ON public.secure_view_name TO authenticated;
GRANT SELECT ON public.secure_view_name TO anon; -- 必要に応じて

-- パターン2: 関数ベースのビュー（より安全）
CREATE VIEW public.secure_view_with_function AS
SELECT 
    *,
    public.safe_aggregate_function(column1) as calculated_field
FROM public.base_table_with_rls 
WHERE public.security_check_function(column1);

-- 4. ビューの監査ログ設定（オプション）
CREATE TABLE IF NOT EXISTS public.view_access_log (
    id SERIAL PRIMARY KEY,
    view_name TEXT NOT NULL,
    accessed_by TEXT,
    accessed_at TIMESTAMP DEFAULT NOW(),
    query_conditions TEXT
);

-- ビューのアクセス監視関数
CREATE OR REPLACE FUNCTION public.log_view_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.view_access_log (view_name, accessed_by, accessed_at)
    VALUES (TG_TABLE_NAME, current_user, NOW());
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 定期的なセキュリティチェック用クエリ
SELECT 
    'セキュリティチェック' as check_type,
    COUNT(*) as security_definer_views_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND EXISTS (
    SELECT 1 
    FROM pg_rewrite r
    WHERE r.ev_class = c.oid
      AND r.ev_security_definer = true
  );
