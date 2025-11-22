-- 超シンプルなビュー修正

-- 1. ビューを削除
DROP VIEW IF EXISTS public.payment_method_trends_view;

-- 2. ビューを再作成
CREATE VIEW public.payment_method_trends_view AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    payment_method,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
FROM public.transactions 
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND payment_method IS NOT NULL
GROUP BY DATE_TRUNC('month', created_at), payment_method
ORDER BY month DESC;

-- 3. 権限設定
GRANT SELECT ON public.payment_method_trends_view TO authenticated;

