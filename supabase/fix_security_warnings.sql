-- Supabaseセキュリティ警告修正
-- Function Search Path Mutable 警告の解決

-- 1. 既存のupdate_updated_at_column関数を削除
DROP FUNCTION IF EXISTS update_updated_at_column();

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

-- 3. 関連するトリガーを再作成（必要に応じて）
-- 注意: 実際のテーブルに応じて調整してください

-- stores テーブルのトリガー
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- store_images テーブルのトリガー
DROP TRIGGER IF EXISTS update_store_images_updated_at ON store_images;
CREATE TRIGGER update_store_images_updated_at 
    BEFORE UPDATE ON store_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- store_bulletins テーブルのトリガー
DROP TRIGGER IF EXISTS update_store_bulletins_updated_at ON store_bulletins;
CREATE TRIGGER update_store_bulletins_updated_at 
    BEFORE UPDATE ON store_bulletins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- lesson_schools テーブルのトリガー
DROP TRIGGER IF EXISTS update_lesson_schools_updated_at ON lesson_schools;
CREATE TRIGGER update_lesson_schools_updated_at 
    BEFORE UPDATE ON lesson_schools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- credit_cards テーブルのトリガー
DROP TRIGGER IF EXISTS update_credit_cards_updated_at ON credit_cards;
CREATE TRIGGER update_credit_cards_updated_at 
    BEFORE UPDATE ON credit_cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- customers テーブルのトリガー
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- purchase_history テーブルのトリガー
DROP TRIGGER IF EXISTS update_purchase_history_updated_at ON purchase_history;
CREATE TRIGGER update_purchase_history_updated_at 
    BEFORE UPDATE ON purchase_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- purchase_items テーブルのトリガー
DROP TRIGGER IF EXISTS update_purchase_items_updated_at ON purchase_items;
CREATE TRIGGER update_purchase_items_updated_at 
    BEFORE UPDATE ON purchase_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 関数の権限設定
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon;

-- 5. セキュリティ設定の確認
-- この関数はSECURITY DEFINERで実行され、search_pathがpublicに固定されています
-- これにより、Function Search Path Mutable警告が解決されます
