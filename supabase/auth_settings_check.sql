-- Supabase認証設定の確認と修正

-- 1. 認証設定の確認
SELECT 
  name,
  value,
  description
FROM auth.config
WHERE name IN (
  'enable_signup',
  'enable_email_confirmations',
  'enable_phone_confirmations',
  'enable_manual_linking'
);

-- 2. 認証プロバイダーの確認
SELECT 
  id,
  provider,
  enabled,
  settings
FROM auth.providers
WHERE provider = 'google';

-- 3. 最近作成されたユーザーの確認
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. 顧客テーブルの確認
SELECT 
  id,
  user_id,
  customer_name,
  customer_email,
  current_points,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 10;

-- 5. 認証設定の修正（必要に応じて実行）
-- UPDATE auth.config 
-- SET value = 'false' 
-- WHERE name = 'enable_email_confirmations';

-- UPDATE auth.config 
-- SET value = 'true' 
-- WHERE name = 'enable_manual_linking';



