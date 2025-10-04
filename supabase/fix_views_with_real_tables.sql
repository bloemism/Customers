-- 実際に存在するテーブルを使用してビューを修正

-- 1. 既存のビューを削除
DROP VIEW IF EXISTS public.payment_method_trends_view CASCADE;

-- 2. 存在するテーブルに基づいてビューを作成
-- ordersテーブルが存在する場合
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'orders'
    ) THEN
        CREATE VIEW public.payment_method_trends_view AS
        SELECT 
            DATE_TRUNC('month', created_at) as month,
            payment_method,
            COUNT(*) as order_count,
            SUM(total_amount) as total_amount,
            AVG(total_amount) as average_amount
        FROM public.orders 
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
          AND payment_method IS NOT NULL
        GROUP BY DATE_TRUNC('month', created_at), payment_method
        ORDER BY month DESC, total_amount DESC;
        
        RAISE NOTICE 'ordersテーブルを使用してpayment_method_trends_viewを作成しました';
    END IF;
END $$;

-- 3. 権限を設定
GRANT SELECT ON public.payment_method_trends_view TO authenticated;

-- 4. 作成されたビューを確認
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';
