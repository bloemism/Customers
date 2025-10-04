-- lesson_schools_backup同期機能の監視

-- 1. 両テーブルのレコード数比較
SELECT 
    'レコード数比較' as check_type,
    (SELECT COUNT(*) FROM lesson_schools) as lesson_schools_count,
    (SELECT COUNT(*) FROM lesson_schools_backup) as lesson_schools_backup_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM lesson_schools) = (SELECT COUNT(*) FROM lesson_schools_backup) 
        THEN '✅ 同期済み' 
        ELSE '❌ 同期エラー' 
    END as sync_status;

-- 2. URLデータの同期状況
SELECT 
    'URLデータ同期状況' as check_type,
    (SELECT COUNT(website_url) FROM lesson_schools WHERE website_url IS NOT NULL) as lesson_schools_url_count,
    (SELECT COUNT(website_url) FROM lesson_schools_backup WHERE website_url IS NOT NULL) as backup_url_count,
    (SELECT COUNT(instagram_url) FROM lesson_schools WHERE instagram_url IS NOT NULL) as lesson_schools_ig_count,
    (SELECT COUNT(instagram_url) FROM lesson_schools_backup WHERE instagram_url IS NOT NULL) as backup_ig_count;

-- 3. 最近の更新データの同期確認
SELECT 
    '最近の更新データ' as check_type,
    ls.name,
    ls.updated_at as lesson_schools_updated,
    lsb.updated_at as backup_updated,
    CASE 
        WHEN ls.updated_at = lsb.updated_at THEN '✅ 同期済み'
        ELSE '❌ 同期遅延'
    END as sync_status
FROM lesson_schools ls
LEFT JOIN lesson_schools_backup lsb ON ls.id = lsb.id
ORDER BY ls.updated_at DESC
LIMIT 5;

-- 4. 同期されていないデータの確認
SELECT 
    '同期されていないデータ' as check_type,
    ls.id,
    ls.name,
    ls.updated_at
FROM lesson_schools ls
LEFT JOIN lesson_schools_backup lsb ON ls.id = lsb.id
WHERE lsb.id IS NULL
LIMIT 10;

-- 5. トリガーの存在確認
SELECT 
    'トリガー確認' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'lesson_schools'
  AND trigger_name = 'sync_lesson_schools_trigger';

-- 6. 関数の存在確認
SELECT 
    '関数確認' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'sync_lesson_schools_to_backup'
  AND routine_schema = 'public';

-- 7. 監視サマリー
SELECT 
    '監視サマリー' as check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM lesson_schools) = (SELECT COUNT(*) FROM lesson_schools_backup)
             AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'sync_lesson_schools_trigger')
        THEN '✅ 同期機能正常'
        ELSE '❌ 同期機能異常'
    END as overall_status;
