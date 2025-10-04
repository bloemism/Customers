-- lesson_schoolsとlesson_schools_backupテーブルの構造確認

-- 1. lesson_schoolsテーブルの構造
SELECT 
    'lesson_schools' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 2. lesson_schools_backupテーブルの構造
SELECT 
    'lesson_schools_backup' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools_backup'
ORDER BY ordinal_position;

-- 3. 両テーブルのデータ件数確認
SELECT 
    'lesson_schools' as table_name,
    COUNT(*) as record_count
FROM lesson_schools
UNION ALL
SELECT 
    'lesson_schools_backup' as table_name,
    COUNT(*) as record_count
FROM lesson_schools_backup;

-- 4. URLカラムの存在確認
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('lesson_schools', 'lesson_schools_backup')
  AND column_name IN ('website_url', 'instagram_url')
ORDER BY table_name, column_name;
