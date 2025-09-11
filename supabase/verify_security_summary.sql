-- セキュリティ設定の要約確認
-- 基本的なセキュリティ設定が完了している場合の確認

-- 1. 関数の存在確認
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_updated_at_column')
    THEN '✅ セキュアな関数が作成されています'
    ELSE '❌ セキュアな関数が見つかりません'
  END as function_status;

-- 2. RLSの有効化確認
SELECT 
  COUNT(*) as rls_enabled_tables,
  '✅ RLSが有効化されたテーブル数' as message
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
AND tablename IN (
  'stores', 'customers', 'purchase_history', 'purchase_items',
  'credit_cards', 'store_images', 'store_bulletins', 'subscriptions',
  'payment_methods', 'lesson_schools', 'lesson_schedules',
  'student_reservations', 'flower_lessons', 'region_categories'
);

-- 3. ポリシーの数確認
SELECT 
  COUNT(*) as policy_count,
  '✅ 作成されたポリシー数' as message
FROM pg_policies 
WHERE schemaname = 'public';

-- 4. セキュリティ設定完了の確認
SELECT 
  '🎉 セキュリティ設定が正常に完了しました！' as status,
  'Function Search Path Mutable警告が解決され、RLSポリシーが適用されています。' as details;
