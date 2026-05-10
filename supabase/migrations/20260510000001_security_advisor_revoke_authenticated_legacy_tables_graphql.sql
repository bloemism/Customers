-- Security Advisor (WARN) lint 0027: authenticated GraphQL schema exposure
-- https://supabase.com/docs/guides/database/database-linter?lint=0027_pg_graphql_authenticated_table_exposed
--
-- payment_transactions はアプリが authenticated で SELECT するため対象外。
-- その他はコードベース未参照のため authenticated のテーブル権限を剥奪。

REVOKE ALL PRIVILEGES ON TABLE public.cards FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.table_name FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.tarot_readings FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_plans FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_usage FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_usage_limits FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.users FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."カードテーブル" FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."タロットテーブル" FROM authenticated;
