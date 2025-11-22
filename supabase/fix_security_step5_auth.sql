-- Step 5: 認証設定の確認と修正
-- Supabaseセキュリティ警告修正 - 第5段階

-- 注意: auth.configテーブルが存在しない場合は、このファイルはスキップしてください
-- 代わりに、Supabaseダッシュボードの認証設定で手動で設定してください

-- 認証プロバイダーの確認
SELECT 
  id,
  provider,
  enabled,
  settings
FROM auth.providers
WHERE provider IN ('google', 'email', 'phone');

-- 最近のユーザー認証状況の確認
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at,
  email_confirmed_at,
  phone_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 認証設定の確認（auth.configが存在する場合のみ）
-- 以下のクエリは、auth.configテーブルが存在しない場合はエラーになります
/*
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
*/
