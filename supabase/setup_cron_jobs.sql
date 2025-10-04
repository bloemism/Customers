-- payment_codesテーブルの定期クリーンアップ用cronジョブ設定

-- 1. pg_cron拡張機能を有効化（Supabase Pro以上で利用可能）
-- 注意: 無料プランでは利用できない場合があります

-- 2. 毎日午前2時にクリーンアップを実行するcronジョブ
-- 期限切れデータ（1時間以上）の削除
SELECT cron.schedule(
  'cleanup-expired-payment-codes',
  '0 2 * * *', -- 毎日午前2時
  'SELECT cleanup_expired_payment_codes();'
);

-- 3. 毎週日曜日午前3時に古いデータをクリーンアップ
-- 使用済みデータ（1週間以上）と古いデータ（1ヶ月半以上）の削除
SELECT cron.schedule(
  'cleanup-old-payment-codes',
  '0 3 * * 0', -- 毎週日曜日午前3時
  'SELECT cleanup_old_payment_codes(); SELECT cleanup_used_payment_codes();'
);

-- 4. 現在のcronジョブ一覧を表示
SELECT * FROM cron.job;

-- 5. 手動でクリーンアップを実行（テスト用）
SELECT cleanup_all_payment_codes();

-- 6. データ統計を表示
SELECT * FROM get_payment_codes_stats();

-- 7. 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE 'payment_codesテーブルの定期クリーンアップを設定しました！';
    RAISE NOTICE 'スケジュール:';
    RAISE NOTICE '- 毎日午前2時: 期限切れデータ削除';
    RAISE NOTICE '- 毎週日曜日午前3時: 古いデータ・使用済みデータ削除';
    RAISE NOTICE '';
    RAISE NOTICE '注意: pg_cronはSupabase Pro以上で利用可能です';
    RAISE NOTICE '無料プランの場合は、手動でクリーンアップを実行してください';
END $$;

