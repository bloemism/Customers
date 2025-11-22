-- RLSを一時的に無効化してテスト
-- 注意: 本番環境では絶対に実行しないでください

-- lesson_schedulesテーブルのRLSを無効化
ALTER TABLE lesson_schedules DISABLE ROW LEVEL SECURITY;

-- lesson_schoolsテーブルのRLSを無効化  
ALTER TABLE lesson_schools DISABLE ROW LEVEL SECURITY;

-- 確認用クエリ
SELECT 
  ls.id as schedule_id,
  ls.title,
  ls.date,
  ls.lesson_school_id,
  lsc.name as school_name
FROM lesson_schedules ls
LEFT JOIN lesson_schools lsc ON ls.lesson_school_id = lsc.id
WHERE ls.lesson_school_id = 'd987cb65-9609-4b91-8983-049567e341e7';
