-- Security Advisor (WARN): GraphQL anon exposure + SECURITY DEFINER RPC
-- Ref: https://supabase.com/docs/guides/database/database-linter?lint=0026_pg_graphql_anon_table_exposed
-- Ref: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

-- 未ログイン (anon) からテーブルへの権限を剥奪し、GraphQL スキーマ上の露出を抑止。
-- ログイン済み (authenticated) の PostgREST アクセスは維持（RLS が効く）。

REVOKE ALL PRIVILEGES ON TABLE public.cards FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.payment_transactions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.table_name FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.tarot_readings FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.user_plans FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.user_usage FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.user_usage_limits FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.users FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."カードテーブル" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."タロットテーブル" FROM anon;

-- auth.users のトリガーのみが呼ぶべき関数（クライアント RPC 不可に）
REVOKE ALL PRIVILEGES ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL PRIVILEGES ON FUNCTION public.handle_new_user() FROM authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
