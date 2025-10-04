-- 安全なビューの再作成（存在するテーブルを使用）

-- Step 1: 既存のビューを削除
DROP VIEW IF EXISTS public.payment_method_trends_view CASCADE;

-- Step 2: 利用可能なテーブルを確認してビューを作成
DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- ordersテーブルの存在確認
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'orders'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- ordersテーブルを使用してビューを作成
        EXECUTE '
        CREATE VIEW public.payment_method_trends_view AS
        SELECT 
            DATE_TRUNC(''month'', created_at) as month,
            payment_method,
            COUNT(*) as order_count,
            SUM(total_amount) as total_amount,
            AVG(total_amount) as average_amount
        FROM public.orders 
        WHERE created_at >= CURRENT_DATE - INTERVAL ''12 months''
          AND payment_method IS NOT NULL
        GROUP BY DATE_TRUNC(''month'', created_at), payment_method
        ORDER BY month DESC, total_amount DESC';
        
        RAISE NOTICE 'ordersテーブルを使用してビューを作成しました';
        
    ELSE
        -- ordersテーブルが存在しない場合、ダミービューを作成
        EXECUTE '
        CREATE VIEW public.payment_method_trends_view AS
        SELECT 
            CURRENT_DATE as month,
            ''No Data'' as payment_method,
            0 as order_count,
            0 as total_amount,
            0 as average_amount
        WHERE false';
        
        RAISE NOTICE 'ordersテーブルが存在しないため、ダミービューを作成しました';
    END IF;
END $$;

-- Step 3: 権限を設定
GRANT SELECT ON public.payment_method_trends_view TO authenticated;

-- Step 4: 結果確認
SELECT 
    'ビュー作成完了' as status,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';
