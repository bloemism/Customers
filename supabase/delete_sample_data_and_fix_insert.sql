-- サンプルデータの削除と新規作成時の保存問題の修正

-- 1. サンプルデータを削除
DELETE FROM lesson_schools 
WHERE name IN (
  'フラワーアレンジメントスクールA',
  '生け花教室B', 
  'プリザーブドフラワー教室C'
);

-- 2. 現在のテーブル構造を確認
SELECT 
  'Current Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 3. RLSポリシーの確認
SELECT 
  'Current RLS Policies' as check_type,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'lesson_schools'
ORDER BY policyname;

-- 4. 一時的にRLSを無効化してテスト
ALTER TABLE lesson_schools DISABLE ROW LEVEL SECURITY;

-- 5. テスト用のデータ挿入（RLS無効化状態で）
INSERT INTO lesson_schools (
  store_email, 
  name, 
  prefecture, 
  city, 
  address, 
  email, 
  phone,
  instructor_name, 
  instructor_bio, 
  lesson_content, 
  main_days, 
  main_time,
  trial_price, 
  regular_price, 
  latitude, 
  longitude, 
  is_active
) VALUES (
  'botanism2011@gmail.com',
  'テストレッスンスクール',
  '東京都',
  '新宿区',
  '東京都新宿区西新宿1-1-1',
  'test@example.com',
  '03-0000-0000',
  'テスト講師',
  'テスト用の講師プロフィール',
  'テスト用のレッスン内容',
  ARRAY['月', '水'],
  '10:00-12:00',
  1000,
  3000,
  35.6895,
  139.6917,
  true
);

-- 6. 挿入されたデータを確認
SELECT 
  'Insert Test Result' as check_type,
  COUNT(*) as inserted_count
FROM lesson_schools 
WHERE name = 'テストレッスンスクール';

-- 7. RLSを再度有効化
ALTER TABLE lesson_schools ENABLE ROW LEVEL SECURITY;

-- 8. RLSポリシーを修正（より適切な設定に）
DROP POLICY IF EXISTS "Users can view all lesson schools" ON lesson_schools;
DROP POLICY IF EXISTS "Store owners can manage their lesson schools" ON lesson_schools;

-- 全ユーザーが閲覧可能
CREATE POLICY "Enable read access for all users" ON lesson_schools 
FOR SELECT USING (true);

-- 認証済みユーザーが自分の店舗のレッスンスクールを管理可能
CREATE POLICY "Enable insert for authenticated users" ON lesson_schools 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  store_email = auth.jwt() ->> 'email'
);

CREATE POLICY "Enable update for store owners" ON lesson_schools 
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  store_email = auth.jwt() ->> 'email'
);

CREATE POLICY "Enable delete for store owners" ON lesson_schools 
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  store_email = auth.jwt() ->> 'email'
);

-- 9. テストデータを削除
DELETE FROM lesson_schools WHERE name = 'テストレッスンスクール';

-- 10. 最終確認
SELECT 
  'Final Status' as check_type,
  COUNT(*) as total_schools,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_schools
FROM lesson_schools;
