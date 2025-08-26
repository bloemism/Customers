-- 使用されていないテーブルの削除スクリプト
-- 注意: 実行前にバックアップを取ってください

-- 1. 使用されていないテーブルの確認
-- 以下のテーブルは実際にデータが入っていない可能性があります

-- store_owner_profiles テーブル（使用されていない場合）
-- DROP TABLE IF EXISTS store_owner_profiles CASCADE;

-- store_owner_sessions テーブル（使用されていない場合）
-- DROP TABLE IF EXISTS store_owner_sessions CASCADE;

-- 2. 実際に使用されているテーブルの確認
-- 以下のテーブルは実際にデータが入っている可能性があります

-- stores テーブル（実際に使用されている）
-- lesson_schools テーブル（実際に使用されている）
-- users テーブル（実際に使用されている）

-- 3. テーブルの状態確認クエリ
-- 実行してデータの有無を確認してください

-- storesテーブルのデータ確認
SELECT COUNT(*) as stores_count FROM stores;

-- lesson_schoolsテーブルのデータ確認
SELECT COUNT(*) as lesson_schools_count FROM lesson_schools;

-- store_owner_profilesテーブルのデータ確認
SELECT COUNT(*) as store_owner_profiles_count FROM store_owner_profiles;

-- 4. 実際のデータサンプル確認
-- 各テーブルの実際のデータを確認

-- storesテーブルのサンプルデータ
SELECT id, name, email, address FROM stores LIMIT 5;

-- lesson_schoolsテーブルのサンプルデータ
SELECT id, name, store_email FROM lesson_schools LIMIT 5;

-- store_owner_profilesテーブルのサンプルデータ
SELECT id, store_name, email FROM store_owner_profiles LIMIT 5;

-- 5. 推奨アクション
-- 1. 上記のクエリを実行してデータの有無を確認
-- 2. データが入っていないテーブルは削除を検討
-- 3. データが入っているテーブルは保持
-- 4. 必要に応じてテーブル構造を統一
