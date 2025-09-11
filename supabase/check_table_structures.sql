-- テーブル構造の確認
-- このSQLを実行してテーブルの実際の構造を確認してください

-- customersテーブルの構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- student_reservationsテーブルの構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_reservations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- purchase_historyテーブルの構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_history' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- storesテーブルの構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;
