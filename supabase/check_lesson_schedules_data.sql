-- lesson_schedulesテーブルのデータ確認
-- 1. テーブル構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'lesson_schedules'
ORDER BY ordinal_position;

-- 2. 全データ確認
SELECT * FROM lesson_schedules;

-- 3. 特定のスクールIDのデータ確認
SELECT * FROM lesson_schedules 
WHERE lesson_school_id = 'd987cb65-9609-4b91-8983-049567e341e7';

-- 4. データ件数確認
SELECT COUNT(*) as total_count FROM lesson_schedules;
