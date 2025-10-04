-- lesson_schoolsテーブルにURLとInstagramカラムを追加

-- 1. 現在のlesson_schoolsテーブル構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 2. URLとInstagramカラムを追加
ALTER TABLE public.lesson_schools 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 3. カラムの説明を追加
COMMENT ON COLUMN public.lesson_schools.website_url IS 'レッスンスクールのウェブサイトURL';
COMMENT ON COLUMN public.lesson_schools.instagram_url IS 'レッスンスクールのInstagramアカウントURL';

-- 4. 追加後のテーブル構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 5. サンプルデータの更新（既存データがある場合）
UPDATE public.lesson_schools 
SET 
    website_url = 'https://example.com',
    instagram_url = 'https://instagram.com/example'
WHERE website_url IS NULL 
  AND instagram_url IS NULL
LIMIT 1;

-- 6. 追加完了メッセージ
SELECT 
    'lesson_schoolsテーブルにURLカラムを追加しました' as status,
    'website_url と instagram_url が利用可能です' as message;
