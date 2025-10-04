-- 安全なlesson_schools_backup同期機能（エラーハンドリング付き）

-- 1. 既存のトリガーを削除
DROP TRIGGER IF EXISTS sync_lesson_schools_trigger ON public.lesson_schools;

-- 2. 安全な同期用トリガー関数を作成（存在するカラムのみ使用）
CREATE OR REPLACE FUNCTION safe_sync_lesson_schools_to_backup()
RETURNS TRIGGER AS $$
BEGIN
    -- lesson_schoolsの変更をlesson_schools_backupに反映（存在するカラムのみ）
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lesson_schools_backup (
            id, name, address, email, phone,
            instructor_name, instructor_bio, lesson_content,
            main_time, trial_price, regular_price, latitude, longitude,
            website_url, instagram_url, is_active, store_email, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.name, NEW.address, NEW.email, NEW.phone,
            NEW.instructor_name, NEW.instructor_bio, NEW.lesson_content,
            NEW.main_time, NEW.trial_price, NEW.regular_price, NEW.latitude, NEW.longitude,
            NEW.website_url, NEW.instagram_url, NEW.is_active, NEW.store_email, NEW.created_at, NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.lesson_schools_backup SET
            name = NEW.name,
            address = NEW.address,
            email = NEW.email,
            phone = NEW.phone,
            instructor_name = NEW.instructor_name,
            instructor_bio = NEW.instructor_bio,
            lesson_content = NEW.lesson_content,
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

-- 3. トリガーを作成
CREATE TRIGGER safe_sync_lesson_schools_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.lesson_schools
    FOR EACH ROW
    EXECUTE FUNCTION safe_sync_lesson_schools_to_backup();

-- 4. lesson_schools_backupテーブルにURLカラムを追加（存在しない場合）
ALTER TABLE public.lesson_schools_backup 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 5. 既存データの同期（存在するカラムのみ使用）
INSERT INTO public.lesson_schools_backup (
    id, name, address, email, phone,
    instructor_name, instructor_bio, lesson_content,
    main_time, trial_price, regular_price, latitude, longitude,
    website_url, instagram_url, is_active, store_email, created_at, updated_at
)
SELECT 
    id, name, address, email, phone,
    instructor_name, instructor_bio, lesson_content,
    main_time, trial_price, regular_price, latitude, longitude,
    website_url, instagram_url, is_active, store_email, created_at, updated_at
FROM public.lesson_schools
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    instructor_name = EXCLUDED.instructor_name,
    instructor_bio = EXCLUDED.instructor_bio,
    lesson_content = EXCLUDED.lesson_content,
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

-- 6. 同期後の状況確認
SELECT 
    '同期後のlesson_schools' as table_name,
    COUNT(*) as record_count,
    COUNT(website_url) as url_count
FROM lesson_schools
UNION ALL
SELECT 
    '同期後のlesson_schools_backup' as table_name,
    COUNT(*) as record_count,
    COUNT(website_url) as url_count
FROM lesson_schools_backup;

-- 7. 完了メッセージ
SELECT 
    '安全なlesson_schools_backup同期機能実装完了' as status,
    '存在するカラムのみを使用して同期されます' as message;
