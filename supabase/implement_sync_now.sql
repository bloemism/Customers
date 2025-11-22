-- 同期機能を今すぐ実装

-- 1. 既存のトリガーを削除
DROP TRIGGER IF EXISTS sync_lesson_schools_trigger ON public.lesson_schools;
DROP TRIGGER IF EXISTS safe_sync_lesson_schools_trigger ON public.lesson_schools;
DROP TRIGGER IF EXISTS perfect_sync_lesson_schools_trigger ON public.lesson_schools;

-- 2. 完全同期用トリガー関数を作成
CREATE OR REPLACE FUNCTION sync_lesson_schools_to_backup()
RETURNS TRIGGER AS $$
BEGIN
    -- lesson_schoolsの変更をlesson_schools_backupに完全同期
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

-- 3. トリガーを作成
CREATE TRIGGER sync_lesson_schools_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.lesson_schools
    FOR EACH ROW
    EXECUTE FUNCTION sync_lesson_schools_to_backup();

-- 4. 既存データの同期（lesson_schoolsからlesson_schools_backupへ）
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

-- 5. 同期機能のテスト
INSERT INTO public.lesson_schools (
    name, prefecture, city, address, email, phone,
    instructor_name, instructor_bio, lesson_content, main_days,
    main_time, trial_price, regular_price, latitude, longitude,
    website_url, instagram_url, is_active, store_email, created_at, updated_at
) VALUES (
    '同期テスト', '東京都', '渋谷区', 'テスト住所', 'sync-test@example.com', '03-1234-5678',
    'テスト先生', 'テスト経歴', 'テストレッスン', ARRAY['月'],
    '10:00-12:00', 3000, 5000, 35.6762, 139.6503,
    'https://sync-test.com', 'https://instagram.com/sync_test',
    true, 'sync-test@example.com', NOW(), NOW()
);

-- 6. 同期テストの確認
SELECT 
    '同期テスト確認' as check_type,
    'lesson_schools' as table_name,
    name,
    website_url,
    instagram_url
FROM lesson_schools 
WHERE name = '同期テスト'
UNION ALL
SELECT 
    '同期テスト確認' as check_type,
    'lesson_schools_backup' as table_name,
    name,
    website_url,
    instagram_url
FROM lesson_schools_backup 
WHERE name = '同期テスト';

-- 7. テストデータの削除
DELETE FROM public.lesson_schools WHERE name = '同期テスト';

-- 8. 削除同期の確認
SELECT 
    '削除同期確認' as check_type,
    (SELECT COUNT(*) FROM lesson_schools WHERE name = '同期テスト') as lesson_schools_count,
    (SELECT COUNT(*) FROM lesson_schools_backup WHERE name = '同期テスト') as backup_count;

-- 9. 最終確認
SELECT 
    '同期機能実装完了' as status,
    (SELECT COUNT(*) FROM lesson_schools) as lesson_schools_total,
    (SELECT COUNT(*) FROM lesson_schools_backup) as backup_total,
    CASE 
        WHEN (SELECT COUNT(*) FROM lesson_schools) = (SELECT COUNT(*) FROM lesson_schools_backup) 
        THEN '✅ 同期成功' 
        ELSE '❌ 同期エラー' 
    END as sync_status;

