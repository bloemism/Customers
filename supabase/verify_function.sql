-- 関数のセキュリティ設定確認
SELECT 
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';
