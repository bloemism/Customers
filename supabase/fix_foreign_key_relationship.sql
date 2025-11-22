-- 外部キー関係の確認と修正

-- 現在の外部キー制約を確認
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('lesson_schedules', 'student_reservations');

-- 現在のデータを確認
SELECT 
  'lesson_schools' as table_name,
  id,
  name,
  store_email
FROM lesson_schools
UNION ALL
SELECT 
  'lesson_schedules' as table_name,
  id,
  title as name,
  lesson_school_id::text as store_email
FROM lesson_schedules;

-- 外部キー制約を削除（既存のものがあれば）
ALTER TABLE lesson_schedules DROP CONSTRAINT IF EXISTS lesson_schedules_lesson_school_id_fkey;
ALTER TABLE student_reservations DROP CONSTRAINT IF EXISTS student_reservations_schedule_id_fkey;

-- 正しい外部キー制約を追加
ALTER TABLE lesson_schedules 
ADD CONSTRAINT lesson_schedules_lesson_school_id_fkey 
FOREIGN KEY (lesson_school_id) REFERENCES lesson_schools(id) ON DELETE CASCADE;

ALTER TABLE student_reservations 
ADD CONSTRAINT student_reservations_schedule_id_fkey 
FOREIGN KEY (schedule_id) REFERENCES lesson_schedules(id) ON DELETE CASCADE;

-- データの整合性を確認
SELECT 
  ls.id as school_id,
  ls.name as school_name,
  lsch.id as schedule_id,
  lsch.title as schedule_title,
  lsch.lesson_school_id
FROM lesson_schools ls
LEFT JOIN lesson_schedules lsch ON ls.id = lsch.lesson_school_id
ORDER BY ls.name, lsch.title;
