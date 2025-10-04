-- lesson_schoolsテーブルの修正（段階的アプローチ）

-- Step 1: 現在のlesson_schoolsテーブル構造確認
SELECT 
    'lesson_schools structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- Step 2: lesson_schools_backupテーブル構造確認
SELECT 
    'lesson_schools_backup structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools_backup'
ORDER BY ordinal_position;

-- Step 3: lesson_schoolsテーブルにURLカラムを追加（エラーハンドリング付き）
DO $$
BEGIN
    -- website_urlカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'lesson_schools'
          AND column_name = 'website_url'
    ) THEN
        ALTER TABLE public.lesson_schools ADD COLUMN website_url TEXT;
        RAISE NOTICE 'website_urlカラムを追加しました';
    ELSE
        RAISE NOTICE 'website_urlカラムは既に存在します';
    END IF;
    
    -- instagram_urlカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'lesson_schools'
          AND column_name = 'instagram_url'
    ) THEN
        ALTER TABLE public.lesson_schools ADD COLUMN instagram_url TEXT;
        RAISE NOTICE 'instagram_urlカラムを追加しました';
    ELSE
        RAISE NOTICE 'instagram_urlカラムは既に存在します';
    END IF;
END $$;

-- Step 4: lesson_schools_backupテーブルにURLカラムを追加（存在する場合のみ）
DO $$
BEGIN
    -- lesson_schools_backupテーブルが存在するかチェック
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'lesson_schools_backup'
    ) THEN
        -- website_urlカラムを追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'lesson_schools_backup'
              AND column_name = 'website_url'
        ) THEN
            ALTER TABLE public.lesson_schools_backup ADD COLUMN website_url TEXT;
            RAISE NOTICE 'lesson_schools_backupにwebsite_urlカラムを追加しました';
        ELSE
            RAISE NOTICE 'lesson_schools_backupのwebsite_urlカラムは既に存在します';
        END IF;
        
        -- instagram_urlカラムを追加
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'lesson_schools_backup'
              AND column_name = 'instagram_url'
        ) THEN
            ALTER TABLE public.lesson_schools_backup ADD COLUMN instagram_url TEXT;
            RAISE NOTICE 'lesson_schools_backupにinstagram_urlカラムを追加しました';
        ELSE
            RAISE NOTICE 'lesson_schools_backupのinstagram_urlカラムは既に存在します';
        END IF;
    ELSE
        RAISE NOTICE 'lesson_schools_backupテーブルが存在しません';
    END IF;
END $$;

-- Step 5: 修正後のテーブル構造確認
SELECT 
    '修正後のlesson_schools' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
  AND column_name IN ('website_url', 'instagram_url')
ORDER BY column_name;

SELECT 
    '修正後のlesson_schools_backup' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools_backup'
  AND column_name IN ('website_url', 'instagram_url')
ORDER BY column_name;

-- Step 6: 完了メッセージ
SELECT 
    'lesson_schoolsテーブル修正完了' as status,
    'URLカラムが追加されました' as message;
