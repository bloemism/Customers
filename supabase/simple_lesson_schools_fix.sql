-- lesson_schoolsテーブルのシンプルな修正

-- 1. lesson_schoolsテーブルにURLカラムを追加
ALTER TABLE public.lesson_schools 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 2. カラムの説明を追加
COMMENT ON COLUMN public.lesson_schools.website_url IS 'レッスンスクールのウェブサイトURL';
COMMENT ON COLUMN public.lesson_schools.instagram_url IS 'レッスンスクールのInstagramアカウントURL';

-- 3. lesson_schools_backupテーブルにURLカラムを追加（テーブルが存在する場合のみ）
ALTER TABLE public.lesson_schools_backup 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 4. 修正後の確認
SELECT 
    'lesson_schools' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
  AND column_name IN ('website_url', 'instagram_url')
ORDER BY column_name;

SELECT 
    'lesson_schools_backup' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools_backup'
  AND column_name IN ('website_url', 'instagram_url')
ORDER BY column_name;

-- 5. 完了メッセージ
SELECT 
    'URLカラム追加完了' as status,
    'lesson_schoolsテーブルでURL機能が利用可能です' as message;
