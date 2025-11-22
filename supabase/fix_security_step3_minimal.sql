-- Step 3: 最小限のRLSポリシー作成
-- 基本的なポリシーのみを段階的に作成

-- storesテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗のみアクセス可能" ON stores
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "認証されたユーザーは店舗を閲覧可能" ON stores
    FOR SELECT USING (auth.role() = 'authenticated');

-- lesson_schoolsテーブルのポリシー
CREATE POLICY "店舗オーナーは自分のレッスンスクールのみアクセス可能" ON lesson_schools
    FOR ALL USING (auth.uid()::text = store_email);

CREATE POLICY "認証されたユーザーはレッスンスクールを閲覧可能" ON lesson_schools
    FOR SELECT USING (auth.role() = 'authenticated');

-- lesson_schedulesテーブルのポリシー
CREATE POLICY "店舗オーナーは自分のレッスンスクールのスケジュールのみアクセス可能" ON lesson_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lesson_schools 
            WHERE lesson_schools.id = lesson_schedules.lesson_school_id 
            AND lesson_schools.store_email = auth.uid()::text
        )
    );

CREATE POLICY "認証されたユーザーはレッスンスケジュールを閲覧可能" ON lesson_schedules
    FOR SELECT USING (auth.role() = 'authenticated');

-- student_reservationsテーブルのポリシー
CREATE POLICY "学生は自分の予約のみアクセス可能" ON student_reservations
    FOR ALL USING (student_email = auth.jwt() ->> 'email');

CREATE POLICY "店舗オーナーは自分のレッスンの予約を閲覧可能" ON student_reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lesson_schedules ls
            JOIN lesson_schools lsc ON lsc.id = ls.lesson_school_id
            WHERE ls.id = student_reservations.schedule_id
            AND lsc.store_email = auth.uid()::text
        )
    );

-- region_categoriesテーブルのポリシー（読み取り専用）
CREATE POLICY "認証されたユーザーは地域カテゴリを閲覧可能" ON region_categories
    FOR SELECT USING (auth.role() = 'authenticated');
