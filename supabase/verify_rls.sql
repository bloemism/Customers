-- RLSの有効化状況確認
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
