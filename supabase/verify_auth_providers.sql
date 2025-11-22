-- 認証プロバイダーの確認（auth.providersが存在しない場合の代替）
-- 注意: auth.providersテーブルが存在しない場合は、このクエリはスキップしてください

-- 代わりに、auth.usersテーブルから認証方法を確認
SELECT 
  'auth.providersテーブルが存在しません。Supabaseダッシュボードの認証設定で確認してください。' as message;
