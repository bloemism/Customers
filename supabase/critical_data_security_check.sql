-- 重要データ（銀行口座・携帯電話番号）のセキュリティ確認

-- 1. 店舗の銀行口座情報のテーブル構造確認
SELECT 
    '店舗銀行口座情報' as data_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%store%' 
    OR table_name LIKE '%bank%'
    OR table_name LIKE '%account%'
  )
  AND (
    column_name LIKE '%bank%'
    OR column_name LIKE '%account%'
    OR column_name LIKE '%routing%'
    OR column_name LIKE '%account_number%'
    OR column_name LIKE '%account_holder%'
  )
ORDER BY table_name, column_name;

-- 2. 顧客の携帯電話番号のテーブル構造確認
SELECT 
    '顧客携帯電話番号' as data_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%customer%'
    OR table_name LIKE '%user%'
  )
  AND (
    column_name LIKE '%phone%'
    OR column_name LIKE '%mobile%'
    OR column_name LIKE '%tel%'
  )
ORDER BY table_name, column_name;

-- 3. 重要データを含むテーブルのRLS確認
SELECT 
    '重要データテーブルRLS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%store%'
    OR tablename LIKE '%customer%'
    OR tablename LIKE '%bank%'
    OR tablename LIKE '%account%'
  )
ORDER BY tablename;

-- 4. 重要データテーブルのRLSポリシー確認
SELECT 
    '重要データRLSポリシー' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd as command,
    qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%store%'
    OR tablename LIKE '%customer%'
    OR tablename LIKE '%bank%'
    OR tablename LIKE '%account%'
  )
ORDER BY tablename, policyname;

