-- customersテーブルの構造確認

-- 1. customersテーブルの構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- 2. customersテーブルのデータを確認
SELECT 
  id,
  user_id,
  email,
  name,
  created_at
FROM customers 
WHERE email = 'botanism2011@gmail.com';

-- 3. 認証ユーザーとの連携状況を確認
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  c.id as customer_id,
  c.user_id as customer_user_id,
  c.email as customer_email
FROM auth.users au
LEFT JOIN customers c ON au.id = c.user_id
WHERE au.email = 'botanism2011@gmail.com';

