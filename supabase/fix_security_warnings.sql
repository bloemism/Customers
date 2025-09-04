-- Supabaseセキュリティ警告修正
-- Function Search Path Mutable 警告の解決

-- 1. 既存のupdate_updated_at_column関数をCASCADEで削除
-- 依存するトリガーも一緒に削除されます
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 2. セキュアなupdate_updated_at_column関数を再作成
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

-- 3. 関連するトリガーを再作成
-- エラーメッセージに表示された全てのテーブルのトリガーを再作成

-- region_categories テーブルのトリガー
CREATE TRIGGER update_region_categories_updated_at 
    BEFORE UPDATE ON region_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- lesson_schools テーブルのトリガー
CREATE TRIGGER update_lesson_schools_updated_at 
    BEFORE UPDATE ON lesson_schools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- student_reservations テーブルのトリガー
CREATE TRIGGER update_student_reservations_updated_at 
    BEFORE UPDATE ON student_reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- lesson_schedules テーブルのトリガー
CREATE TRIGGER update_lesson_schedules_updated_at 
    BEFORE UPDATE ON lesson_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- store_images テーブルのトリガー
CREATE TRIGGER update_store_images_updated_at 
    BEFORE UPDATE ON store_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- store_bulletins テーブルのトリガー
CREATE TRIGGER update_store_bulletins_updated_at 
    BEFORE UPDATE ON store_bulletins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- payment_methods テーブルのトリガー
CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- subscriptions テーブルのトリガー
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- customers テーブルのトリガー
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- flower_lessons テーブルのトリガー
CREATE TRIGGER update_flower_lessons_updated_at 
    BEFORE UPDATE ON flower_lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- その他のテーブル（存在する場合）
-- stores テーブルのトリガー
CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- credit_cards テーブルのトリガー
CREATE TRIGGER update_credit_cards_updated_at 
    BEFORE UPDATE ON credit_cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- purchase_history テーブルのトリガー
CREATE TRIGGER update_purchase_history_updated_at 
    BEFORE UPDATE ON purchase_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- purchase_items テーブルのトリガー
CREATE TRIGGER update_purchase_items_updated_at 
    BEFORE UPDATE ON purchase_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 関数の権限設定
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon;

-- 5. セキュリティ設定の確認
-- この関数はSECURITY DEFINERで実行され、search_pathがpublicに固定されています
-- これにより、Function Search Path Mutable警告が解決されます
