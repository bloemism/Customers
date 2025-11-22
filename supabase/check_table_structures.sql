-- lesson_schoolsとlesson_schools_backupテーブルの構造詳細確認

-- 1. lesson_schoolsテーブルの全カラム
SELECT 
    'lesson_schools' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 2. lesson_schools_backupテーブルの全カラム
SELECT 
    'lesson_schools_backup' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools_backup'
ORDER BY ordinal_position;

-- 3. 両テーブルのカラム比較
WITH lesson_schools_cols AS (
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'lesson_schools'
),
lesson_schools_backup_cols AS (
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'lesson_schools_backup'
)
SELECT 
    'lesson_schoolsにのみ存在' as diff_type,
    column_name
FROM lesson_schools_cols
WHERE column_name NOT IN (SELECT column_name FROM lesson_schools_backup_cols)
UNION ALL
SELECT 
    'lesson_schools_backupにのみ存在' as diff_type,
    column_name
FROM lesson_schools_backup_cols
WHERE column_name NOT IN (SELECT column_name FROM lesson_schools_colup_cols);

-- 4. 共通カラムの確認
SELECT 
    '共通カラム' as check_type,
    ls.column_name,
    ls.data_type as lesson_schools_type,
    lsb.data_type as backup_type,
    CASE 
        WHEN ls.data_type = lsb.data_type THEN '✅ 一致'
        ELSE '❌ 不一致'
    END as type_match
FROM information_schema.columns ls
JOIN information_schema.columns lsb ON ls.column_name = lsb.column_name
WHERE ls.table_schema = 'public' 
  AND ls.table_name = 'lesson_schools'
  AND lsb.table_schema = 'public' 
  AND lsb.table_name = 'lesson_schools_backup'
ORDER BY ls.column_name;