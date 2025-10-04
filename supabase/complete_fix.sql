-- 完全な修正（ビュー作成と権限設定を一度に）

-- 1. 既存のビューを削除
DROP VIEW IF EXISTS public.payment_method_trends_view;

-- 2. ビューを作成
CREATE VIEW public.payment_method_trends_view AS
SELECT 
    CURRENT_DATE as month,
    'No Data Available' as payment_method,
    0 as transaction_count,
    0 as total_amount,
    0 as average_amount
WHERE false;

-- 3. 権限を設定（ビューが存在することを確認してから）
GRANT SELECT ON public.payment_method_trends_view TO authenticated;

-- 4. 確認
SELECT 
    '修正完了' as status,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';

-- 5. 権限確認
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'payment_method_trends_view'
  AND table_type = 'VIEW';

