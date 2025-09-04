-- Step 2: 主要テーブルのトリガー再作成
-- Supabaseセキュリティ警告修正 - 第2段階

-- エラーメッセージに表示された主要テーブルのトリガーを再作成

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
