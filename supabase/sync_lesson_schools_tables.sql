-- lesson_schoolsテーブルにURLカラムを追加し、両テーブルを同期

-- 1. lesson_schoolsテーブルにURLカラムを追加
ALTER TABLE public.lesson_schools 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 2. カラムの説明を追加
COMMENT ON COLUMN public.lesson_schools.website_url IS 'レッスンスクールのウェブサイトURL';
COMMENT ON COLUMN public.lesson_schools.instagram_url IS 'レッスンスクールのInstagramアカウントURL';

-- 3. lesson_schools_backupからURLデータをコピー（既存データがある場合）
UPDATE public.lesson_schools 
SET 
    website_url = backup.website_url,
    instagram_url = backup.instagram_url
FROM public.lesson_schools_backup backup
WHERE lesson_schools.id = backup.id
  AND (lesson_schools.website_url IS NULL OR lesson_schools.instagram_url IS NULL);

-- 4. 両テーブルの構造を統一するための追加カラム確認
-- lesson_schools_backupにあってlesson_schoolsにないカラムを確認
SELECT 
    'lesson_schools_backupにあるがlesson_schoolsにないカラム' as check_type,
    backup_cols.column_name
FROM (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'lesson_schools_backup'
) backup_cols
LEFT JOIN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'lesson_schools'
) main_cols ON backup_cols.column_name = main_cols.column_name
WHERE main_cols.column_name IS NULL;

-- 5. データ同期用のトリガー関数を作成
CREATE OR REPLACE FUNCTION sync_lesson_schools_to_backup()
RETURNS TRIGGER AS $$
BEGIN
    -- lesson_schoolsの変更をlesson_schools_backupに反映
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lesson_schools_backup (
            id, name, prefecture, city, address, email, phone,
            instructor_name, instructor_bio, lesson_content, main_days,
            main_time, trial_price, regular_price, latitude, longitude,
            website_url, instagram_url, is_active, store_email, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.name, NEW.prefecture, NEW.city, NEW.address, NEW.email, NEW.phone,
            NEW.instructor_name, NEW.instructor_bio, NEW.lesson_content, NEW.main_days,
            NEW.main_time, NEW.trial_price, NEW.regular_price, NEW.latitude, NEW.longitude,
            NEW.website_url, NEW.instagram_url, NEW.is_active, NEW.store_email, NEW.created_at, NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.lesson_schools_backup SET
            name = NEW.name,
            prefecture = NEW.prefecture,
            city = NEW.city,
            address = NEW.address,
            email = NEW.email,
            phone = NEW.phone,
            instructor_name = NEW.instructor_name,
            instructor_bio = NEW.instructor_bio,
            lesson_content = NEW.lesson_content,
            main_days = NEW.main_days,
            main_time = NEW.main_time,
            trial_price = NEW.trial_price,
            regular_price = NEW.regular_price,
            latitude = NEW.latitude,
            longitude = NEW.longitude,
            website_url = NEW.website_url,
            instagram_url = NEW.instagram_url,
            is_active = NEW.is_active,
            store_email = NEW.store_email,
            created_at = NEW.created_at,
            updated_at = NEW.updated_at
        WHERE id = NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM public.lesson_schools_backup WHERE id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. トリガーを作成
DROP TRIGGER IF EXISTS sync_lesson_schools_trigger ON public.lesson_schools;
CREATE TRIGGER sync_lesson_schools_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.lesson_schools
    FOR EACH ROW
    EXECUTE FUNCTION sync_lesson_schools_to_backup();

-- 7. 既存データの同期（lesson_schoolsからlesson_schools_backupへ）
INSERT INTO public.lesson_schools_backup (
    id, name, prefecture, city, address, email, phone,
    instructor_name, instructor_bio, lesson_content, main_days,
    main_time, trial_price, regular_price, latitude, longitude,
    website_url, instagram_url, is_active, store_email, created_at, updated_at
)
SELECT 
    id, name, prefecture, city, address, email, phone,
    instructor_name, instructor_bio, lesson_content, main_days,
    main_time, trial_price, regular_price, latitude, longitude,
    website_url, instagram_url, is_active, store_email, created_at, updated_at
FROM public.lesson_schools
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    prefecture = EXCLUDED.prefecture,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    instructor_name = EXCLUDED.instructor_name,
    instructor_bio = EXCLUDED.instructor_bio,
    lesson_content = EXCLUDED.lesson_content,
    main_days = EXCLUDED.main_days,
    main_time = EXCLUDED.main_time,
    trial_price = EXCLUDED.trial_price,
    regular_price = EXCLUDED.regular_price,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    website_url = EXCLUDED.website_url,
    instagram_url = EXCLUDED.instagram_url,
    is_active = EXCLUDED.is_active,
    store_email = EXCLUDED.store_email,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

-- 8. 完了メッセージ
SELECT 
    'lesson_schoolsテーブルの同期設定完了' as status,
    '両テーブルにデータが自動同期されます' as message;
