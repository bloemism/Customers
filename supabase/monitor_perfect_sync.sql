-- lesson_schools完全同期機能の監視

-- 1. 両テーブルの構造比較（完全一致確認）
WITH lesson_schools_cols AS (
    SELECT column_name, data_type, ordinal_position
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'lesson_schools'
),
lesson_schools_backup_cols AS (
    SELECT column_name, data_type, ordinal_position
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'lesson_schools_backup'
)
SELECT 
    '構造比較' as check_type,
    ls.column_name,
    ls.data_type as lesson_schools_type,
    lsb.data_type as backup_type,
    ls.ordinal_position,
    CASE 
        WHEN ls.data_type = lsb.data_type AND ls.ordinal_position = lsb.ordinal_position THEN '✅ 完全一致'
        ELSE '❌ 不一致'
    END as match_status
FROM lesson_schools_cols ls
FULL OUTER JOIN lesson_schools_backup_cols lsb ON ls.column_name = lsb.column_name
ORDER BY COALESCE(ls.ordinal_position, lsb.ordinal_position);

-- 2. レコード数比較
SELECT 
    'レコード数比較' as check_type,
    (SELECT COUNT(*) FROM lesson_schools) as lesson_schools_count,
    (SELECT COUNT(*) FROM lesson_schools_backup) as lesson_schools_backup_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM lesson_schools) = (SELECT COUNT(*) FROM lesson_schools_backup) 
        THEN '✅ 同期済み' 
        ELSE '❌ 同期エラー' 
    END as sync_status;

-- 3. URLデータの同期状況
SELECT 
    'URLデータ同期状況' as check_type,
    (SELECT COUNT(website_url) FROM lesson_schools WHERE website_url IS NOT NULL) as lesson_schools_url_count,
    (SELECT COUNT(website_url) FROM lesson_schools_backup WHERE website_url IS NOT NULL) as backup_url_count,
    (SELECT COUNT(instagram_url) FROM lesson_schools WHERE instagram_url IS NOT NULL) as lesson_schools_ig_count,
    (SELECT COUNT(instagram_url) FROM lesson_schools_backup WHERE instagram_url IS NOT NULL) as backup_ig_count;

-- 4. 最近の更新データの同期確認
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

-- 5. 同期されていないデータの確認
SELECT 
    '同期されていないデータ' as check_type,
    ls.id,
    ls.name,
    ls.updated_at
FROM lesson_schools ls
LEFT JOIN lesson_schools_backup lsb ON ls.id = lsb.id
WHERE lsb.id IS NULL
LIMIT 10;

-- 6. トリガーの存在確認
SELECT 
    'トリガー確認' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'lesson_schools'
  AND trigger_name = 'perfect_sync_lesson_schools_trigger';

-- 7. 関数の存在確認
SELECT 
    '関数確認' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'perfect_sync_lesson_schools_to_backup'
  AND routine_schema = 'public';

-- 8. データ整合性チェック
SELECT 
    'データ整合性チェック' as check_type,
    ls.name,
    ls.website_url as ls_website_url,
    lsb.website_url as backup_website_url,
    ls.instagram_url as ls_instagram_url,
    lsb.instagram_url as backup_instagram_url,
    CASE 
        WHEN ls.website_url = lsb.website_url AND ls.instagram_url = lsb.instagram_url THEN '✅ 整合'
        ELSE '❌ 不整合'
    END as integrity_status
FROM lesson_schools ls
JOIN lesson_schools_backup lsb ON ls.id = lsb.id
WHERE ls.website_url IS NOT NULL OR ls.instagram_url IS NOT NULL
ORDER BY ls.updated_at DESC
LIMIT 10;

-- 9. 監視サマリー
SELECT 
    '監視サマリー' as check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM lesson_schools) = (SELECT COUNT(*) FROM lesson_schools_backup)
             AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'perfect_sync_lesson_schools_trigger')
             AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'lesson_schools') = 
                 (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'lesson_schools_backup')
        THEN '✅ 完全同期機能正常'
        ELSE '❌ 同期機能異常'
    END as overall_status;
