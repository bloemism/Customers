-- payment_codesテーブルのクリーンアップ設定（cronなし版）
-- Supabase無料プラン対応

-- 1. クリーンアップ関数の作成（既存の改善版）
CREATE OR REPLACE FUNCTION cleanup_expired_payment_codes()
RETURNS void AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 期限切れデータを削除（1時間以上経過）
  DELETE FROM payment_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- ログ出力
  RAISE NOTICE '期限切れデータを % 件削除しました', deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 2. 古いデータの自動削除関数（1ヶ月半以上経過）
CREATE OR REPLACE FUNCTION cleanup_old_payment_codes()
RETURNS void AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 1ヶ月半（45日）以上経過したデータを削除
  DELETE FROM payment_codes 
  WHERE created_at < NOW() - INTERVAL '45 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- ログ出力
  RAISE NOTICE '古いデータを % 件削除しました', deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 3. 使用済みデータの自動削除関数（1週間以上経過）
CREATE OR REPLACE FUNCTION cleanup_used_payment_codes()
RETURNS void AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 使用済みデータで1週間以上経過したものを削除
  DELETE FROM payment_codes 
  WHERE used_at IS NOT NULL 
  AND used_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- ログ出力
  RAISE NOTICE '使用済みデータを % 件削除しました', deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 4. 総合クリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_all_payment_codes()
RETURNS void AS $$
DECLARE
  total_deleted INTEGER := 0;
  expired_count INTEGER;
  old_count INTEGER;
  used_count INTEGER;
BEGIN
  -- 期限切れデータを削除
  DELETE FROM payment_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  total_deleted := total_deleted + expired_count;
  
  -- 古いデータを削除（1ヶ月半以上）
  DELETE FROM payment_codes 
  WHERE created_at < NOW() - INTERVAL '45 days';
  GET DIAGNOSTICS old_count = ROW_COUNT;
  total_deleted := total_deleted + old_count;
  
  -- 使用済みデータを削除（1週間以上）
  DELETE FROM payment_codes 
  WHERE used_at IS NOT NULL 
  AND used_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS used_count = ROW_COUNT;
  total_deleted := total_deleted + used_count;
  
  -- ログ出力
  RAISE NOTICE 'クリーンアップ完了: 期限切れ % 件, 古いデータ % 件, 使用済み % 件, 合計 % 件削除', 
    expired_count, old_count, used_count, total_deleted;
END;
$$ LANGUAGE plpgsql;

-- 5. データ統計表示関数
CREATE OR REPLACE FUNCTION get_payment_codes_stats()
RETURNS TABLE(
  total_count BIGINT,
  expired_count BIGINT,
  used_count BIGINT,
  unused_count BIGINT,
  old_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_count,
    COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used_count,
    COUNT(*) FILTER (WHERE used_at IS NULL AND expires_at >= NOW()) as unused_count,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '45 days') as old_count
  FROM payment_codes;
END;
$$ LANGUAGE plpgsql;

-- 6. 手動クリーンアップ実行（テスト用）
SELECT cleanup_all_payment_codes();

-- 7. 現在のデータ統計を表示
SELECT * FROM get_payment_codes_stats();

-- 8. 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE 'payment_codesテーブルの手動クリーンアップ機能を設定しました！';
    RAISE NOTICE '削除ルール:';
    RAISE NOTICE '- 期限切れデータ: 1時間以上経過';
    RAISE NOTICE '- 使用済みデータ: 1週間以上経過';
    RAISE NOTICE '- 古いデータ: 1ヶ月半（45日）以上経過';
    RAISE NOTICE '';
    RAISE NOTICE '手動クリーンアップ方法:';
    RAISE NOTICE '1. SELECT cleanup_all_payment_codes(); -- 全クリーンアップ';
    RAISE NOTICE '2. SELECT * FROM get_payment_codes_stats(); -- 統計確認';
    RAISE NOTICE '3. 管理画面（AdminCleanup.tsx）でも実行可能';
    RAISE NOTICE '';
    RAISE NOTICE '定期的なクリーンアップを推奨します！';
END $$;

