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
