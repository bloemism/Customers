-- 87アプリ Supabaseセキュリティ問題の包括的修正
-- このファイルをSupabaseダッシュボードのSQL Editorで実行してください

-- ==============================================
-- 1. Function Search Path Mutable 警告の修正
-- ==============================================

-- 既存の関数を削除
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- セキュアな関数を再作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon;

-- ==============================================
-- 2. Row Level Security (RLS) の有効化
-- ==============================================

-- 主要テーブルでRLSを有効化
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flower_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_categories ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 3. RLSポリシーの作成
-- ==============================================

-- storesテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗のみアクセス可能" ON stores
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "認証されたユーザーは店舗を閲覧可能" ON stores
    FOR SELECT USING (auth.role() = 'authenticated');

-- customersテーブルのポリシー
CREATE POLICY "顧客は自分のデータのみアクセス可能" ON customers
    FOR ALL USING (auth.uid() = user_id);

-- purchase_historyテーブルのポリシー
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

-- student_reservationsテーブルのポリシー
CREATE POLICY "学生は自分の予約のみアクセス可能" ON student_reservations
    FOR ALL USING (auth.uid() = student_id);

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

-- ==============================================
-- 4. トリガーの再作成
-- ==============================================

-- 主要テーブルのトリガーを再作成
CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_history_updated_at 
    BEFORE UPDATE ON purchase_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_items_updated_at 
    BEFORE UPDATE ON purchase_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at 
    BEFORE UPDATE ON credit_cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_images_updated_at 
    BEFORE UPDATE ON store_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_bulletins_updated_at 
    BEFORE UPDATE ON store_bulletins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_schools_updated_at 
    BEFORE UPDATE ON lesson_schools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_schedules_updated_at 
    BEFORE UPDATE ON lesson_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_reservations_updated_at 
    BEFORE UPDATE ON student_reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flower_lessons_updated_at 
    BEFORE UPDATE ON flower_lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_region_categories_updated_at 
    BEFORE UPDATE ON region_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 5. 認証設定の確認と修正
-- ==============================================

-- 認証設定を確認
SELECT 
  name,
  value,
  description
FROM auth.config
WHERE name IN (
  'enable_signup',
  'enable_email_confirmations',
  'enable_phone_confirmations',
  'enable_manual_linking'
);

-- 本番環境用の認証設定（必要に応じて調整）
UPDATE auth.config 
SET value = 'true' 
WHERE name = 'enable_signup';

UPDATE auth.config 
SET value = 'true' 
WHERE name = 'enable_email_confirmations';

UPDATE auth.config 
SET value = 'false' 
WHERE name = 'enable_phone_confirmations';

UPDATE auth.config 
SET value = 'true' 
WHERE name = 'enable_manual_linking';

-- ==============================================
-- 6. セキュリティ設定の確認
-- ==============================================

-- 関数のセキュリティ設定を確認
SELECT 
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';

-- RLSの有効化状況を確認
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'stores', 'customers', 'purchase_history', 'purchase_items',
  'credit_cards', 'store_images', 'store_bulletins', 'subscriptions',
  'payment_methods', 'lesson_schools', 'lesson_schedules',
  'student_reservations', 'flower_lessons', 'region_categories'
);

-- ポリシーの確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
