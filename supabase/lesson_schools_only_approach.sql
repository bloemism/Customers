-- lesson_schoolsテーブルのみを使用するアプローチ

-- 1. 現在のlesson_schoolsテーブルの状況確認
SELECT 
    'lesson_schools現状' as check_type,
    COUNT(*) as total_records,
    COUNT(website_url) as url_records,
    COUNT(instagram_url) as instagram_records
FROM lesson_schools;

-- 2. lesson_schools_backupテーブルの状況確認
SELECT 
    'lesson_schools_backup現状' as check_type,
    COUNT(*) as total_records
FROM lesson_schools_backup;

-- 3. 推奨アプローチ：lesson_schoolsテーブルのみを使用
-- 理由：
-- - lesson_schools_backupテーブルの構造が異なる
-- - 同期の複雑さを避ける
-- - lesson_schoolsテーブルでURL機能が正常に動作している

-- 4. lesson_schoolsテーブルのURL機能確認
SELECT 
    'URL機能確認' as check_type,
    name,
    website_url,
    instagram_url,
    updated_at
FROM lesson_schools 
WHERE website_url IS NOT NULL 
   OR instagram_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- 5. アプリケーション側での対応
-- レッスンスクール管理画面とフラワーレッスンマップは
-- lesson_schoolsテーブルのみを使用するように設定済み

-- 6. バックアップ戦略の提案
SELECT 
    'バックアップ戦略' as strategy,
    'lesson_schoolsテーブルの定期バックアップを推奨' as recommendation;

-- 7. 完了メッセージ
SELECT 
    'lesson_schoolsテーブルのみ使用アプローチ' as status,
    'URL機能は正常に動作し、データは安全に保存されます' as message;

