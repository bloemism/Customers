-- セキュリティ設定の最終確認
-- このSQLを実行して設定状況を確認してください

-- 1. 関数のセキュリティ設定確認
SELECT 
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';

-- 2. RLSの有効化状況確認
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'stores', 'customers', 'purchase_history', 'purchase_items',
  'credit_cards', 'store_images', 'store_bulletins', 'subscriptions',
  'payment_methods', 'lesson_schools', 'lesson_schedules',
  'student_reservations', 'flower_lessons', 'region_categories'
)
ORDER BY tablename;

-- 3. ポリシーの確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. 認証設定の確認（auth.configが存在しない場合の代替）
-- 注意: auth.configテーブルが存在しない場合は、この部分はスキップしてください

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
