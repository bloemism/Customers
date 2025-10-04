-- シンプルなビュー修正スクリプト

-- 1. payment_method_trends_viewを削除
DROP VIEW IF EXISTS public.payment_method_trends_view CASCADE;

-- 2. 安全なビューを再作成
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

-- 3. 権限を設定
GRANT SELECT ON public.payment_method_trends_view TO authenticated;
GRANT SELECT ON public.payment_method_trends_view TO anon;

-- 4. 修正後の確認
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';

