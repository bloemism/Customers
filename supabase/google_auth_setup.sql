-- Google認証設定の確認と修正
-- 87app Flower Shop Management System
-- 注意: Supabase v2では認証プロバイダーの設定はダッシュボードで行います

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
  'enable_manual_linking',
  'site_url',
  'redirect_urls'
);

-- 2. 認証設定の更新（開発環境用）
UPDATE auth.config 
SET value = 'true' 
WHERE name = 'enable_signup';

UPDATE auth.config 
SET value = 'false' 
WHERE name = 'enable_email_confirmations';

UPDATE auth.config 
SET value = 'false' 
WHERE name = 'enable_phone_confirmations';

UPDATE auth.config 
SET value = 'true' 
WHERE name = 'enable_manual_linking';

-- 3. リダイレクトURLの設定
UPDATE auth.config 
SET value = '["http://localhost:5183/auth/callback", "https://your-domain.com/auth/callback"]' 
WHERE name = 'redirect_urls';

-- 4. サイトURLの設定
UPDATE auth.config 
SET value = 'http://localhost:5183' 
WHERE name = 'site_url';

-- 5. 修正後の設定を確認
SELECT 
  name,
  value,
  description
FROM auth.config
WHERE name IN (
  'enable_signup',
  'enable_email_confirmations',
  'enable_phone_confirmations',
  'enable_manual_linking',
  'site_url',
  'redirect_urls'
);

-- 6. 最近の認証エラーログを確認
SELECT 
  id,
  user_id,
  event_type,
  error_message,
  created_at
FROM auth.audit_log_entries
WHERE event_type LIKE '%error%' OR event_type LIKE '%failed%'
ORDER BY created_at DESC
LIMIT 10;

-- 7. 完了メッセージ
SELECT '認証設定の確認と修正が完了しました。Google認証はダッシュボードで設定してください。' as message;
