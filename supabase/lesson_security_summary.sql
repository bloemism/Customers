-- レッスン関連テーブルのセキュリティ設計まとめ

/*
【セキュリティ設計の考え方】

1. 顧客向け表示（フラワーレッスンマップ）
   - lesson_schools: 全スクール情報を公開表示
   - 目的: 顧客がスクールを検索・発見できるようにする

2. 管理機能（店舗オーナー向け）
   - lesson_schools: 自分のスクールのみ管理可能
   - new_lesson_schedules: 自分のスクールのスケジュールのみ管理可能
   - customer_participations: 自分のスクールの顧客参加情報のみ閲覧可能
   - lesson_completions: 自分のスクールの完了記録のみ閲覧可能

3. データの分離
   - 各店舗のデータは完全に分離
   - 他の店舗の管理データには一切アクセス不可
   - 顧客データも該当スクールのオーナーのみアクセス可能
*/

-- 現在のポリシー状況確認
SELECT 
    tablename,
    policyname,
    cmd as command,
    CASE 
        WHEN qual LIKE '%is_active = true%' THEN '顧客向け公開'
        WHEN qual LIKE '%store_email%' THEN '店舗オーナー管理'
        WHEN qual LIKE '%customer_email%' THEN '顧客自身'
        ELSE 'その他'
    END as access_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'lesson_schools', 
    'new_lesson_schedules',
    'customer_participations',
    'lesson_completions'
  )
ORDER BY tablename, policyname;
