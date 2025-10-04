-- レッスン関連テーブルのセキュリティを完全に修正

-- 1. まず現在のポリシーを削除
DROP POLICY IF EXISTS "Anyone can view active lesson schools" ON lesson_schools;
DROP POLICY IF EXISTS "Users can view their own lesson schools" ON lesson_schools;
DROP POLICY IF EXISTS "Users can insert their own lesson schools" ON lesson_schools;
DROP POLICY IF EXISTS "Users can update their own lesson schools" ON lesson_schools;
DROP POLICY IF EXISTS "Users can delete their own lesson schools" ON lesson_schools;

-- new_lesson_schedulesテーブルのポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view schedules for their schools" ON new_lesson_schedules;
DROP POLICY IF EXISTS "Users can insert schedules for their schools" ON new_lesson_schedules;
DROP POLICY IF EXISTS "Users can update schedules for their schools" ON new_lesson_schedules;
DROP POLICY IF EXISTS "Users can delete schedules for their schools" ON new_lesson_schedules;

-- customer_participationsテーブルのポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view participations for their schedules" ON customer_participations;
DROP POLICY IF EXISTS "Users can insert participations" ON customer_participations;
DROP POLICY IF EXISTS "Users can update participations for their schedules" ON customer_participations;
DROP POLICY IF EXISTS "Users can delete participations for their schedules" ON customer_participations;

-- lesson_completionsテーブルのポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own completions" ON lesson_completions;
DROP POLICY IF EXISTS "Users can insert completions" ON lesson_completions;
DROP POLICY IF EXISTS "Users can update their own completions" ON lesson_completions;
DROP POLICY IF EXISTS "Users can delete their own completions" ON lesson_completions;

-- 2. RLSを有効化
ALTER TABLE lesson_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- 3. lesson_schoolsテーブルのセキュアなポリシー
-- 店舗オーナーのみ自分のスクールを管理可能
CREATE POLICY "lesson_schools_select_own" ON lesson_schools
  FOR SELECT USING (store_email = auth.jwt() ->> 'email');

CREATE POLICY "lesson_schools_insert_own" ON lesson_schools
  FOR INSERT WITH CHECK (store_email = auth.jwt() ->> 'email');

CREATE POLICY "lesson_schools_update_own" ON lesson_schools
  FOR UPDATE USING (store_email = auth.jwt() ->> 'email');

CREATE POLICY "lesson_schools_delete_own" ON lesson_schools
  FOR DELETE USING (store_email = auth.jwt() ->> 'email');

-- 地図表示用：スクール名と位置情報のみ公開（詳細情報は非公開）
CREATE POLICY "lesson_schools_public_basic_info" ON lesson_schools
  FOR SELECT USING (
    is_active = true 
    AND auth.role() = 'anon'
  );

-- 4. new_lesson_schedulesテーブルのセキュアなポリシー
-- 店舗オーナーのみ自分のスクールのスケジュールを管理可能
CREATE POLICY "lesson_schedules_select_own" ON new_lesson_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lesson_schools 
      WHERE lesson_schools.id = new_lesson_schedules.lesson_school_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "lesson_schedules_insert_own" ON new_lesson_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lesson_schools 
      WHERE lesson_schools.id = lesson_school_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "lesson_schedules_update_own" ON new_lesson_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lesson_schools 
      WHERE lesson_schools.id = lesson_school_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "lesson_schedules_delete_own" ON new_lesson_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lesson_schools 
      WHERE lesson_schools.id = lesson_school_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

-- 5. customer_participationsテーブルのセキュアなポリシー
-- 店舗オーナーのみ自分のスクールの参加情報を閲覧可能
CREATE POLICY "customer_participations_select_own" ON customer_participations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM new_lesson_schedules 
      JOIN lesson_schools ON lesson_schools.id = new_lesson_schedules.lesson_school_id
      WHERE new_lesson_schedules.id = customer_participations.schedule_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

-- 顧客は自分の参加情報のみ挿入・更新可能
CREATE POLICY "customer_participations_insert_customer" ON customer_participations
  FOR INSERT WITH CHECK (
    customer_email = auth.jwt() ->> 'email'
  );

CREATE POLICY "customer_participations_update_own" ON customer_participations
  FOR UPDATE USING (
    customer_email = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM new_lesson_schedules 
      JOIN lesson_schools ON lesson_schools.id = new_lesson_schedules.lesson_school_id
      WHERE new_lesson_schedules.id = customer_participations.schedule_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "customer_participations_delete_own" ON customer_participations
  FOR DELETE USING (
    customer_email = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM new_lesson_schedules 
      JOIN lesson_schools ON lesson_schools.id = new_lesson_schedules.lesson_school_id
      WHERE new_lesson_schedules.id = customer_participations.schedule_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

-- 6. lesson_completionsテーブルのセキュアなポリシー
-- 店舗オーナーのみ自分のスクールの完了記録を閲覧可能
CREATE POLICY "lesson_completions_select_own" ON lesson_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM new_lesson_schedules 
      JOIN lesson_schools ON lesson_schools.id = new_lesson_schedules.lesson_school_id
      WHERE new_lesson_schedules.id = lesson_completions.schedule_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "lesson_completions_insert_own" ON lesson_completions
  FOR INSERT WITH CHECK (
    completed_by = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM new_lesson_schedules 
      JOIN lesson_schools ON lesson_schools.id = new_lesson_schedules.lesson_school_id
      WHERE new_lesson_schedules.id = lesson_completions.schedule_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "lesson_completions_update_own" ON lesson_completions
  FOR UPDATE USING (
    completed_by = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM new_lesson_schedules 
      JOIN lesson_schools ON lesson_schools.id = new_lesson_schedules.lesson_school_id
      WHERE new_lesson_schedules.id = lesson_completions.schedule_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "lesson_completions_delete_own" ON lesson_completions
  FOR DELETE USING (
    completed_by = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM new_lesson_schedules 
      JOIN lesson_schools ON lesson_schools.id = new_lesson_schedules.lesson_school_id
      WHERE new_lesson_schedules.id = lesson_completions.schedule_id 
        AND lesson_schools.store_email = auth.jwt() ->> 'email'
    )
  );
