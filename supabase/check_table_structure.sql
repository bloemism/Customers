-- テーブル構造確認スクリプト
-- 各テーブルの実際のカラム構造を確認

-- 1. storesテーブルの構造確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;

-- 2. lesson_schoolsテーブルの構造確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_schools' 
ORDER BY ordinal_position;

-- 3. store_owner_profilesテーブルの構造確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'store_owner_profiles' 
ORDER BY ordinal_position;

-- 4. usersテーブルの構造確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. テーブルの存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stores', 'lesson_schools', 'store_owner_profiles', 'users')
ORDER BY table_name;

-- 6. 各テーブルのデータ件数確認
SELECT 'stores' as table_name, COUNT(*) as record_count FROM stores
UNION ALL
SELECT 'lesson_schools' as table_name, COUNT(*) as record_count FROM lesson_schools
UNION ALL
SELECT 'users' as table_name, COUNT(*) as record_count FROM users;
