-- 権限エラーを修正

-- 1. 現在のビュー状況を確認
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';

-- 2. ビューが存在する場合のみ権限を設定
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
          AND viewname = 'payment_method_trends_view'
    ) THEN
        GRANT SELECT ON public.payment_method_trends_view TO authenticated;
        RAISE NOTICE '権限を設定しました';
    ELSE
        RAISE NOTICE 'ビューが存在しないため、権限設定をスキップしました';
    END IF;
END $$;

-- 3. 最終確認
SELECT 
    '権限設定完了' as status,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname = 'payment_method_trends_view';
