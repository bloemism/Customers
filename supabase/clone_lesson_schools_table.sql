-- lesson_schoolsテーブルを完全複製してbackupテーブルを作成

-- 1. 現在のlesson_schoolsテーブル構造を確認
SELECT 
    'lesson_schools構造' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 2. 既存のlesson_schools_backupテーブルを削除
DROP TABLE IF EXISTS public.lesson_schools_backup CASCADE;

-- 3. lesson_schoolsテーブルを完全複製してlesson_schools_backupを作成
CREATE TABLE public.lesson_schools_backup (LIKE public.lesson_schools INCLUDING ALL);

-- 4. lesson_schools_backupテーブルの構造確認
SELECT 
    'lesson_schools_backup構造' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools_backup'
ORDER BY ordinal_position;

-- 5. lesson_schoolsからlesson_schools_backupにデータをコピー
INSERT INTO public.lesson_schools_backup 
SELECT * FROM public.lesson_schools;

-- 6. コピーされたデータの確認
SELECT 
    'データコピー確認' as check_type,
    (SELECT COUNT(*) FROM lesson_schools) as lesson_schools_count,
    (SELECT COUNT(*) FROM lesson_schools_backup) as backup_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM lesson_schools) = (SELECT COUNT(*) FROM lesson_schools_backup) 
        THEN '✅ コピー完了' 
        ELSE '❌ コピーエラー' 
    END as copy_status;

-- 7. URLデータのコピー確認
SELECT 
    'URLデータコピー確認' as check_type,
    (SELECT COUNT(website_url) FROM lesson_schools WHERE website_url IS NOT NULL) as lesson_schools_url_count,
    (SELECT COUNT(website_url) FROM lesson_schools_backup WHERE website_url IS NOT NULL) as backup_url_count,
    (SELECT COUNT(instagram_url) FROM lesson_schools WHERE instagram_url IS NOT NULL) as lesson_schools_ig_count,
    (SELECT COUNT(instagram_url) FROM lesson_schools_backup WHERE instagram_url IS NOT NULL) as backup_ig_count;

-- 8. 完了メッセージ
SELECT 
    'lesson_schools_backupテーブル作成完了' as status,
    'lesson_schoolsと完全に同じ構造のバックアップテーブルが作成されました' as message;

