-- customersテーブルと認証IDの連携修正

-- 1. 現在のcustomersテーブルの状況を確認
SELECT 
  id,
  user_id,
  email,
  name,
  created_at
FROM customers 
ORDER BY created_at DESC;

-- 2. 重複データを確認
SELECT 
  email,
  COUNT(*) as count
FROM customers 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 3. 認証ユーザーとの連携状況を確認
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name
FROM auth.users au
LEFT JOIN customers c ON au.id = c.user_id
WHERE au.email = 'botanism2011@gmail.com';

-- 4. 問題のあるデータを削除（重複や連携が切れているデータ）
DELETE FROM customers 
WHERE user_id IS NULL 
   OR user_id NOT IN (SELECT id FROM auth.users);

-- 5. 正しい認証IDでcustomersデータを更新
UPDATE customers 
SET user_id = 'a10425fb-db28-4db1-b731-0a5368aa7c06'
WHERE email = 'botanism2011@gmail.com' 
  AND user_id IS NULL;

-- 6. 重複データがある場合は最新のもの以外を削除
WITH ranked_customers AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM customers
  WHERE email = 'botanism2011@gmail.com'
)
DELETE FROM customers 
WHERE id IN (
  SELECT id FROM ranked_customers WHERE rn > 1
);

-- 7. 最終確認
SELECT 
  c.id,
  c.user_id,
  c.email,
  c.name,
  c.created_at,
  au.id as auth_user_id,
  au.email as auth_email
FROM customers c
LEFT JOIN auth.users au ON c.user_id = au.id
WHERE c.email = 'botanism2011@gmail.com';

-- 8. 認証IDでcustomersデータが取得できるかテスト
SELECT * FROM customers 
WHERE user_id = 'a10425fb-db28-4db1-b731-0a5368aa7c06';

