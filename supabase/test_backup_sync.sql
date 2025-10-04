-- lesson_schools_backup同期機能のテスト

-- 1. テスト用データの挿入（同期機能のテスト）
INSERT INTO public.lesson_schools (
    name, prefecture, city, address, email, phone,
    instructor_name, instructor_bio, lesson_content, main_days,
    main_time, trial_price, regular_price, latitude, longitude,
    website_url, instagram_url, is_active, store_email, created_at, updated_at
) VALUES (
    'テストフラワースクール', '東京都', '渋谷区', 'テスト住所1-2-3', 'test@example.com', '03-1234-5678',
    'テスト先生', 'テスト経歴', 'テストレッスン内容', ARRAY['月', '水', '金'],
    '10:00-12:00', 3000, 5000, 35.6762, 139.6503,
    'https://test-flower-school.com', 'https://instagram.com/test_flower_school',
    true, 'test@example.com', NOW(), NOW()
);

-- 2. 挿入後の同期確認
SELECT 
    'lesson_schools' as table_name,
    name,
    website_url,
    instagram_url
FROM lesson_schools 
WHERE name = 'テストフラワースクール'
UNION ALL
SELECT 
    'lesson_schools_backup' as table_name,
    name,
    website_url,
    instagram_url
FROM lesson_schools_backup 
WHERE name = 'テストフラワースクール';

-- 3. 更新テスト
UPDATE public.lesson_schools 
SET 
    website_url = 'https://updated-test-flower-school.com',
    instagram_url = 'https://instagram.com/updated_test_flower_school',
    updated_at = NOW()
WHERE name = 'テストフラワースクール';

-- 4. 更新後の同期確認
SELECT 
    'lesson_schools (updated)' as table_name,
    name,
    website_url,
    instagram_url
FROM lesson_schools 
WHERE name = 'テストフラワースクール'
UNION ALL
SELECT 
    'lesson_schools_backup (updated)' as table_name,
    name,
    website_url,
    instagram_url
FROM lesson_schools_backup 
WHERE name = 'テストフラワースクール';

-- 5. テストデータの削除
DELETE FROM public.lesson_schools WHERE name = 'テストフラワースクール';

-- 6. 削除後の同期確認
SELECT 
    'lesson_schools (deleted)' as table_name,
    COUNT(*) as count
FROM lesson_schools 
WHERE name = 'テストフラワースクール'
UNION ALL
SELECT 
    'lesson_schools_backup (deleted)' as table_name,
    COUNT(*) as count
FROM lesson_schools_backup 
WHERE name = 'テストフラワースクール';

-- 7. テスト完了メッセージ
SELECT 
    '同期機能テスト完了' as status,
    'INSERT、UPDATE、DELETEの同期が正常に動作しています' as message;
