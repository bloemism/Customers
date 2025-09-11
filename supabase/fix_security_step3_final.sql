-- Step 3: 最終的なRLSポリシー作成
-- 残りのテーブルのポリシー

-- credit_cardsテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗のクレジットカード情報のみアクセス可能" ON credit_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = credit_cards.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

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
