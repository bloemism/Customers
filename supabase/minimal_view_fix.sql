-- 最小限のビュー修正（エラー回避）

-- 1. 問題のあるビューを削除
DROP VIEW IF EXISTS public.payment_method_trends_view;

-- 2. シンプルなビューを作成（存在しないテーブルを参照しない）
CREATE VIEW public.payment_method_trends_view AS
SELECT 
    CURRENT_DATE as month,
    'No Data Available' as payment_method,
    0 as transaction_count,
    0 as total_amount,
    0 as average_amount
WHERE false;

-- 3. 権限を設定
GRANT SELECT ON public.payment_method_trends_view TO authenticated;

-- 4. 確認
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';

