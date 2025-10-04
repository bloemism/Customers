-- レッスン関連テーブルのセキュリティを修正（顧客向けマップ表示対応）

-- 1. 既存のポリシーを削除
DROP POLICY IF EXISTS "lesson_schools_public_basic_info" ON lesson_schools;
DROP POLICY IF EXISTS "lesson_schools_select_own" ON lesson_schools;
DROP POLICY IF EXISTS "lesson_schools_insert_own" ON lesson_schools;
DROP POLICY IF EXISTS "lesson_schools_update_own" ON lesson_schools;
DROP POLICY IF EXISTS "lesson_schools_delete_own" ON lesson_schools;

-- 2. lesson_schoolsテーブルの新しいポリシー
-- 顧客向け：全スクール情報を公開表示（マップ用）
CREATE POLICY "lesson_schools_public_view" ON lesson_schools
  FOR SELECT USING (is_active = true);

-- 店舗オーナー：自分のスクールのみ管理可能
CREATE POLICY "lesson_schools_owner_management" ON lesson_schools
  FOR ALL USING (store_email = auth.jwt() ->> 'email')
  WITH CHECK (store_email = auth.jwt() ->> 'email');

-- 3. スケジュール情報のセキュリティは維持
-- new_lesson_schedulesは店舗オーナーのみアクセス可能（顧客は直接アクセスしない）
-- customer_participationsは店舗オーナーのみアクセス可能
-- lesson_completionsは店舗オーナーのみアクセス可能

-- これらのポリシーは既存のものをそのまま維持
