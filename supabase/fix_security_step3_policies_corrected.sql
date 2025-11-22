-- Step 3: RLSポリシーの作成（修正版）
-- Supabaseセキュリティ警告修正 - 第3段階（修正版）

-- storesテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗のみアクセス可能" ON stores
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "認証されたユーザーは店舗を閲覧可能" ON stores
    FOR SELECT USING (auth.role() = 'authenticated');

-- customersテーブルのポリシー（user_idが存在する場合）
-- 注意: 実際のテーブル構造に応じて調整が必要
CREATE POLICY "顧客は自分のデータのみアクセス可能" ON customers
    FOR ALL USING (auth.uid() = user_id);

-- purchase_historyテーブルのポリシー（customer_idが存在する場合）
CREATE POLICY "顧客は自分の購入履歴のみアクセス可能" ON purchase_history
    FOR ALL USING (auth.uid() = customer_id);

-- purchase_itemsテーブルのポリシー
CREATE POLICY "購入履歴のアイテムは関連する顧客のみアクセス可能" ON purchase_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_history 
            WHERE purchase_history.id = purchase_items.purchase_id 
            AND purchase_history.customer_id = auth.uid()
        )
    );

-- credit_cardsテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗のクレジットカード情報のみアクセス可能" ON credit_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = credit_cards.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

-- store_imagesテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗の画像のみアクセス可能" ON store_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = store_images.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "認証されたユーザーは店舗画像を閲覧可能" ON store_images
    FOR SELECT USING (auth.role() = 'authenticated');

-- store_bulletinsテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗の掲示板のみアクセス可能" ON store_bulletins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = store_bulletins.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "認証されたユーザーは店舗掲示板を閲覧可能" ON store_bulletins
    FOR SELECT USING (auth.role() = 'authenticated');

-- subscriptionsテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗のサブスクリプションのみアクセス可能" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = subscriptions.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

-- payment_methodsテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗の支払い方法のみアクセス可能" ON payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = payment_methods.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

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

-- student_reservationsテーブルのポリシー（修正版）
-- 学生は自分のメールアドレスで予約を識別
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

-- flower_lessonsテーブルのポリシー
CREATE POLICY "店舗オーナーは自分のレッスンのみアクセス可能" ON flower_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lesson_schools 
            WHERE lesson_schools.id = flower_lessons.lesson_school_id 
            AND lesson_schools.store_email = auth.uid()::text
        )
    );

CREATE POLICY "認証されたユーザーはレッスンを閲覧可能" ON flower_lessons
    FOR SELECT USING (auth.role() = 'authenticated');

-- region_categoriesテーブルのポリシー（読み取り専用）
CREATE POLICY "認証されたユーザーは地域カテゴリを閲覧可能" ON region_categories
    FOR SELECT USING (auth.role() = 'authenticated');
