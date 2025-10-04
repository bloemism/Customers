-- ビューを安全に修正するスクリプト

-- 1. まず問題のあるビューを削除
-- payment_method_trends_viewが存在する場合のみ削除
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
          AND viewname = 'payment_method_trends_view'
    ) THEN
        DROP VIEW IF EXISTS public.payment_method_trends_view CASCADE;
        RAISE NOTICE 'payment_method_trends_view を削除しました';
    ELSE
        RAISE NOTICE 'payment_method_trends_view は存在しません';
    END IF;
END $$;

-- 2. 安全なビューを再作成
-- transactionsテーブルが存在する場合のみ作成
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'transactions'
    ) THEN
        -- payment_method_trends_viewを再作成（SECURITY DEFINERなし）
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
        
        -- 権限を設定
        GRANT SELECT ON public.payment_method_trends_view TO authenticated;
        GRANT SELECT ON public.payment_method_trends_view TO anon;
        
        RAISE NOTICE 'payment_method_trends_view を再作成しました';
    ELSE
        RAISE NOTICE 'transactionsテーブルが存在しないため、ビューを作成できません';
    END IF;
END $$;

-- 3. 他の一般的なビューも同様に処理
-- 例: sales_trends_view
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
          AND viewname = 'sales_trends_view'
    ) THEN
        DROP VIEW IF EXISTS public.sales_trends_view CASCADE;
        RAISE NOTICE 'sales_trends_view を削除しました';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'orders'
    ) THEN
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
        
        RAISE NOTICE 'sales_trends_view を再作成しました';
    END IF;
END $$;

-- 4. 修正後の確認
SELECT 
    '修正後のビュー一覧' as status,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

