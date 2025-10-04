-- payment_codesテーブルの手動クリーンアップガイド
-- pg_cronが利用できない場合の代替案

-- 1. 現在のデータ統計を確認
SELECT * FROM get_payment_codes_stats();

-- 2. 期限切れデータの確認（1時間以上経過）
SELECT 
  code,
  created_at,
  expires_at,
  used_at,
  EXTRACT(EPOCH FROM (NOW() - expires_at))/3600 as hours_expired
FROM payment_codes 
WHERE expires_at < NOW() - INTERVAL '1 hour'
ORDER BY expires_at DESC
LIMIT 10;

-- 3. 使用済みデータの確認（1週間以上経過）
SELECT 
  code,
  created_at,
  used_at,
  EXTRACT(EPOCH FROM (NOW() - used_at))/86400 as days_since_used
FROM payment_codes 
WHERE used_at IS NOT NULL 
AND used_at < NOW() - INTERVAL '7 days'
ORDER BY used_at DESC
LIMIT 10;

-- 4. 古いデータの確認（1ヶ月半以上経過）
SELECT 
  code,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/86400 as days_old
FROM payment_codes 
WHERE created_at < NOW() - INTERVAL '45 days'
ORDER BY created_at DESC
LIMIT 10;

-- 5. 手動クリーンアップ実行（段階的）
-- 5-1. 期限切れデータのみ削除
SELECT cleanup_expired_payment_codes();

-- 5-2. 使用済みデータのみ削除
SELECT cleanup_used_payment_codes();

-- 5-3. 古いデータのみ削除
SELECT cleanup_old_payment_codes();

-- 5-4. 全クリーンアップ実行
SELECT cleanup_all_payment_codes();

-- 6. クリーンアップ後の統計確認
SELECT * FROM get_payment_codes_stats();

-- 7. 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE '手動クリーンアップが完了しました！';
    RAISE NOTICE '定期的なクリーンアップを推奨します：';
    RAISE NOTICE '- 毎日: 期限切れデータ削除';
    RAISE NOTICE '- 毎週: 使用済みデータ削除';
    RAISE NOTICE '- 毎月: 古いデータ削除';
    RAISE NOTICE '';
    RAISE NOTICE '管理画面（AdminCleanup.tsx）でもクリーンアップ可能です';
END $$;

