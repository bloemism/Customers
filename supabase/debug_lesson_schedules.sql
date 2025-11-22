-- レッスンスケジュールのデバッグ用SQL
-- 1. 全講座データを確認
SELECT 
  ls.id,
  ls.title,
  ls.date,
  ls.start_time,
  ls.end_time,
  ls.lesson_school_id,
  lsc.name as school_name,
  lsc.store_email
FROM lesson_schedules ls
LEFT JOIN lesson_schools lsc ON ls.lesson_school_id = lsc.id
ORDER BY ls.created_at DESC;

-- 2. 特定のスクールIDの講座を確認
SELECT 
  ls.id,
  ls.title,
  ls.date,
  ls.start_time,
  ls.end_time,
  ls.lesson_school_id,
  lsc.name as school_name,
  lsc.store_email
FROM lesson_schedules ls
LEFT JOIN lesson_schools lsc ON ls.lesson_school_id = lsc.id
WHERE ls.lesson_school_id = 'd987cb65-9609-4b91-8983-049567e341e7'
ORDER BY ls.created_at DESC;

-- 3. レッスンスクールの確認
SELECT 
  id,
  name,
  store_email,
  is_active
FROM lesson_schools
WHERE store_email = 'your-email@example.com'  -- 実際のメールアドレスに置き換えてください
ORDER BY created_at DESC;
