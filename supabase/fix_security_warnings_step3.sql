-- Step 3: その他のテーブルのトリガー再作成
-- Supabaseセキュリティ警告修正 - 第3段階

-- その他のテーブル（存在する場合）のトリガーを再作成

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
