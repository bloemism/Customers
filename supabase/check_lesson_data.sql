-- 1. レッスンスクールの確認
SELECT 
  id,
  name,
  store_email,
  is_active
FROM lesson_schools
WHERE store_email = 'deblwinkel@gmail.com'
ORDER BY created_at DESC;

-- 2. レッスンスケジュールの確認
SELECT 
  id,
  title,
  date,
  start_time,
  end_time,
  lesson_school_id,
  is_active
FROM lesson_schedules
ORDER BY created_at DESC;

-- 3. スクールIDとスケジュールの紐付け確認
SELECT 
  ls.id as schedule_id,
  ls.title,
  ls.date,
  ls.start_time,
  ls.end_time,
  ls.lesson_school_id,
  lsc.id as school_id,
  lsc.name as school_name,
  lsc.store_email
FROM lesson_schedules ls
LEFT JOIN lesson_schools lsc ON ls.lesson_school_id = lsc.id
ORDER BY ls.created_at DESC;

-- 4. 特定のスクールIDの講座のみ表示
SELECT 
  ls.id as schedule_id,
  ls.title,
  ls.date,
  ls.start_time,
  ls.end_time,
  ls.lesson_school_id,
  lsc.name as school_name
FROM lesson_schedules ls
LEFT JOIN lesson_schools lsc ON ls.lesson_school_id = lsc.id
WHERE ls.lesson_school_id = 'd987cb65-9609-4b91-8983-049567e341e7'
ORDER BY ls.date ASC;
