-- customersデータのデバッグと修正

-- 1. 現在のcustomersテーブルの全データを確認
SELECT 
  id,
  user_id,
  email,
  name,
  phone,
  points,
  level,
  created_at
FROM customers 
ORDER BY created_at DESC;

-- 2. 認証ユーザーの確認
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'botanism2011@gmail.com'
ORDER BY created_at DESC;

-- 3. 認証IDとcustomersテーブルの連携状況を確認
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  au.created_at as auth_created_at,
  c.id as customer_id,
  c.user_id as customer_user_id,
  c.email as customer_email,
  c.name as customer_name,
  c.created_at as customer_created_at
FROM auth.users au
LEFT JOIN customers c ON au.id = c.user_id
WHERE au.email = 'botanism2011@gmail.com';

-- 4. 問題のあるデータを特定
-- user_idがnullまたは存在しない認証IDを参照しているデータ
SELECT 
  c.id,
  c.user_id,
  c.email,
  c.name,
  c.created_at
FROM customers c
WHERE c.user_id IS NULL 
   OR c.user_id NOT IN (SELECT id FROM auth.users);

-- 5. 重複データの確認
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as customer_ids
FROM customers 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 6. 最新の認証ユーザーIDを取得
SELECT id FROM auth.users 
WHERE email = 'botanism2011@gmail.com' 
ORDER BY created_at DESC 
LIMIT 1;


