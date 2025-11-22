-- lesson_schoolsテーブルのRLSポリシー設定

-- RLSを有効化
ALTER TABLE lesson_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_categories ENABLE ROW LEVEL SECURITY;

-- lesson_schoolsテーブルのポリシー
-- 認証されたユーザーは自分のスクールのみ閲覧・編集可能
CREATE POLICY "Users can view their own lesson schools" ON lesson_schools
  FOR SELECT USING (auth.uid()::text = store_email OR store_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own lesson schools" ON lesson_schools
  FOR INSERT WITH CHECK (auth.uid()::text = store_email OR store_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own lesson schools" ON lesson_schools
  FOR UPDATE USING (auth.uid()::text = store_email OR store_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own lesson schools" ON lesson_schools
  FOR DELETE USING (auth.uid()::text = store_email OR store_email = auth.jwt() ->> 'email');

-- 公開閲覧用（フラワーレッスンマップ用）
CREATE POLICY "Anyone can view active lesson schools" ON lesson_schools
  FOR SELECT USING (is_active = true);

-- lesson_schedulesテーブルのポリシー
CREATE POLICY "Users can view schedules for their schools" ON lesson_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lesson_schools 
      WHERE lesson_schools.id = lesson_schedules.lesson_school_id 
        AND (auth.uid()::text = lesson_schools.store_email OR lesson_schools.store_email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can insert schedules for their schools" ON lesson_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lesson_schools 
      WHERE lesson_schools.id = lesson_schools_id 
        AND (auth.uid()::text = lesson_schools.store_email OR lesson_schools.store_email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can update schedules for their schools" ON lesson_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lesson_schools 
      WHERE lesson_schools.id = lesson_schools_id 
        AND (auth.uid()::text = lesson_schools.store_email OR lesson_schools.store_email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can delete schedules for their schools" ON lesson_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lesson_schools 
      WHERE lesson_schools.id = lesson_schools_id 
        AND (auth.uid()::text = lesson_schools.store_email OR lesson_schools.store_email = auth.jwt() ->> 'email')
    )
  );

-- student_reservationsテーブルのポリシー
CREATE POLICY "Users can view reservations for their schedules" ON student_reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lesson_schedules 
      JOIN lesson_schools ON lesson_schools.id = lesson_schedules.lesson_school_id
      WHERE lesson_schedules.id = student_reservations.schedule_id 
        AND (auth.uid()::text = lesson_schools.store_email OR lesson_schools.store_email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Anyone can insert reservations" ON student_reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update reservations for their schedules" ON student_reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lesson_schedules 
      JOIN lesson_schools ON lesson_schools.id = lesson_schedules.lesson_school_id
      WHERE lesson_schedules.id = student_reservations.schedule_id 
        AND (auth.uid()::text = lesson_schools.store_email OR lesson_schools.store_email = auth.jwt() ->> 'email')
    )
  );

-- region_categoriesテーブルのポリシー（公開読み取り専用）
CREATE POLICY "Anyone can view region categories" ON region_categories
  FOR SELECT USING (true);

-- 既存のポリシーを削除（重複回避）
DROP POLICY IF EXISTS "Users can view their own lesson schools" ON lesson_schools;
DROP POLICY IF EXISTS "Users can insert their own lesson schools" ON lesson_schools;
DROP POLICY IF EXISTS "Users can update their own lesson schools" ON lesson_schools;
DROP POLICY IF EXISTS "Users can delete their own lesson schools" ON lesson_schools;
DROP POLICY IF EXISTS "Anyone can view active lesson schools" ON lesson_schools;
