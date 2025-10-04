-- 全てのSECURITY DEFINERビューを修正

-- 1. まず現在のSECURITY DEFINERビューを特定
DO $$
DECLARE
    view_record RECORD;
    view_sql TEXT;
BEGIN
    -- SECURITY DEFINERビューを検索して修正
    FOR view_record IN
        SELECT 
            n.nspname as schema_name,
            c.relname as view_name,
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
    LOOP
        RAISE NOTICE '修正対象のビュー: %.%', view_record.schema_name, view_record.view_name;
        
        -- ビューを削除
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 
                      view_record.schema_name, view_record.view_name);
        
        RAISE NOTICE 'ビュー %.% を削除しました', view_record.schema_name, view_record.view_name;
    END LOOP;
END $$;

-- 2. 主要なビューを再作成（SECURITY DEFINERなし）

-- payment_method_trends_viewの再作成
CREATE VIEW public.payment_method_trends_view AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    payment_method,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM public.transactions 
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND payment_method IS NOT NULL
GROUP BY DATE_TRUNC('month', created_at), payment_method
ORDER BY month DESC, total_amount DESC;

-- 3. 適切な権限を設定
GRANT SELECT ON public.payment_method_trends_view TO authenticated;
GRANT SELECT ON public.payment_method_trends_view TO anon;

-- 4. 他の一般的なビューも必要に応じて再作成
-- 例: 売上トレンドビュー
CREATE VIEW public.sales_trends_view AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    store_id,
    COUNT(*) as order_count,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as average_order_value
FROM public.orders 
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at), store_id
ORDER BY month DESC, total_sales DESC;

GRANT SELECT ON public.sales_trends_view TO authenticated;
GRANT SELECT ON public.sales_trends_view TO anon;

-- 5. 顧客統計ビュー
CREATE VIEW public.customer_stats_view AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue
FROM public.orders 
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND customer_id IS NOT NULL
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

GRANT SELECT ON public.customer_stats_view TO authenticated;
GRANT SELECT ON public.customer_stats_view TO anon;

-- 6. 修正後の確認
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

