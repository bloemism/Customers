-- 実際に存在するテーブルを確認

-- 1. 全てのテーブル一覧
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. ビュー一覧
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 3. テーブルの列情報（主要テーブル）
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN (
    'orders',
    'payments', 
    'customer_purchases',
    'lesson_schools',
    'stores',
    'customers'
  )
ORDER BY table_name, ordinal_position;

