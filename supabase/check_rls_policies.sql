-- RLSポリシーの確認
-- 1. lesson_schedulesテーブルのRLSポリシー
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'lesson_schedules';

-- 2. lesson_schoolsテーブルのRLSポリシー
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'lesson_schools';

-- 3. 現在のユーザーでlesson_schedulesにアクセス可能かテスト
SELECT 
  id,
  title,
  lesson_school_id
FROM lesson_schedules
LIMIT 5;

-- 4. 特定のスクールIDでアクセス可能かテスト
SELECT 
  id,
  title,
  lesson_school_id
FROM lesson_schedules
WHERE lesson_school_id = 'd987cb65-9609-4b91-8983-049567e341e7';
