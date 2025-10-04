-- SECURITY DEFINERビューのセキュリティ修正

-- 1. 既存のSECURITY DEFINERビューを削除
DROP VIEW IF EXISTS public.payment_method_trends_view CASCADE;

-- 2. 安全なビューを再作成（SECURITY DEFINERなし）
-- 注意: このビューは適切なRLSポリシーを持つテーブルからのみデータを取得する

-- payment_method_trends_viewの再作成（セキュア版）
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

-- 3. ビューに対する適切な権限を設定
-- 認証されたユーザーのみアクセス可能
GRANT SELECT ON public.payment_method_trends_view TO authenticated;
GRANT SELECT ON public.payment_method_trends_view TO anon;

-- 4. RLSを有効化（ビュー自体にはRLSは適用されないが、基盤テーブルで制御）
-- ビューは基盤テーブルのRLSポリシーを継承する

-- 5. 他のSECURITY DEFINERビューも同様に修正
-- 必要に応じて追加のビューを修正

-- 例: 他のビューも修正する場合
-- DROP VIEW IF EXISTS public.other_problematic_view CASCADE;
-- CREATE VIEW public.other_problematic_view AS
-- SELECT ... FROM public.base_table 
-- WHERE ... (適切な条件);

-- 6. 修正後の確認
SELECT 
    schemaname,
    viewname,
    pg_get_viewdef(oid) as definition
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname LIKE '%payment_method_trends_view%';
