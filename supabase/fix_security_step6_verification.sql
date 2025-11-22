-- Step 6: セキュリティ設定の確認
-- Supabaseセキュリティ警告修正 - 第6段階

-- 関数のセキュリティ設定を確認
SELECT 
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';

-- RLSの有効化状況を確認
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
);

-- ポリシーの確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
