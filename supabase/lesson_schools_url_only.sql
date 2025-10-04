-- lesson_schoolsテーブルのURL機能のみを有効化

-- 1. lesson_schoolsテーブルにURLカラムを追加
ALTER TABLE public.lesson_schools 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 2. カラムの説明を追加
COMMENT ON COLUMN public.lesson_schools.website_url IS 'レッスンスクールのウェブサイトURL';
COMMENT ON COLUMN public.lesson_schools.instagram_url IS 'レッスンスクールのInstagramアカウントURL';

-- 3. URLカラムの確認
SELECT 
    'URLカラム確認' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
  AND column_name IN ('website_url', 'instagram_url')
ORDER BY column_name;

-- 4. サンプルデータでURL機能をテスト
UPDATE public.lesson_schools 
SET 
    website_url = 'https://example-flower-school.com',
    instagram_url = 'https://instagram.com/example_flower_school'
WHERE id = (
    SELECT id FROM public.lesson_schools LIMIT 1
);

-- 5. テストデータの確認
SELECT 
    id,
    name,
    website_url,
    instagram_url
FROM public.lesson_schools 
WHERE website_url IS NOT NULL 
   OR instagram_url IS NOT NULL
LIMIT 3;

-- 6. 完了メッセージ
SELECT 
    'lesson_schools URL機能有効化完了' as status,
    'アプリケーションでURL機能が利用可能です' as message;

