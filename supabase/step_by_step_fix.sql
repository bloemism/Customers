-- ステップバイステップでビューを修正

-- Step 1: 現在の状況確認
SELECT 'Step 1: 現在のビュー確認' as step;

SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Step 2: payment_method_trends_viewが存在するかチェック
SELECT 'Step 2: payment_method_trends_view存在確認' as step;

SELECT EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' 
      AND viewname = 'payment_method_trends_view'
) as view_exists;

-- Step 3: transactionsテーブルが存在するかチェック
SELECT 'Step 3: transactionsテーブル存在確認' as step;

SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'transactions'
) as table_exists;

