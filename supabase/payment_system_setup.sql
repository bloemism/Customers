-- Payment System Setup for 87app
-- 決済システム用のデータベーススキーマ

-- 1. 取引テーブル
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    store_id UUID NOT NULL,
    total_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    items JSONB -- 商品詳細をJSONで保存
);

-- 2. 決済通知テーブル（87app-customersからの通知）
CREATE TABLE IF NOT EXISTS payment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    store_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    items JSONB, -- 商品詳細
    metadata JSONB -- 追加情報（決済方法の詳細など）
);

-- 3. 顧客統計更新用の関数
CREATE OR REPLACE FUNCTION update_customer_statistics(
    customer_id UUID,
    purchase_amount INTEGER,
    points_earned INTEGER
) RETURNS VOID AS $$
BEGIN
    -- 顧客の統計情報を更新
    UPDATE customers 
    SET 
        total_points = total_points + points_earned,
        total_purchase_amount = total_purchase_amount + purchase_amount,
        last_purchase_date = NOW(),
        updated_at = NOW()
    WHERE id = customer_id;
    
    -- 初回購入日の設定
    UPDATE customers 
    SET first_purchase_date = COALESCE(first_purchase_date, NOW())
    WHERE id = customer_id AND first_purchase_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. 決済完了時の自動処理トリガー
CREATE OR REPLACE FUNCTION handle_payment_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- 決済が完了した場合のみ処理
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 取引テーブルのステータスを更新
        UPDATE transactions 
        SET 
            status = 'completed',
            updated_at = NOW()
        WHERE transaction_id = NEW.transaction_id;
        
        -- 顧客統計を更新
        PERFORM update_customer_statistics(
            NEW.customer_id,
            NEW.amount,
            FLOOR(NEW.amount * 0.01) -- 1%のポイント
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. トリガーの作成
DROP TRIGGER IF EXISTS payment_completion_trigger ON payment_notifications;
CREATE TRIGGER payment_completion_trigger
    AFTER UPDATE ON payment_notifications
    FOR EACH ROW
    EXECUTE FUNCTION handle_payment_completion();

-- 6. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_notifications_transaction_id ON payment_notifications(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_customer_id ON payment_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_status ON payment_notifications(status);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_timestamp ON payment_notifications(timestamp);

-- 7. RLSポリシーの設定
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全ての取引データにアクセス可能
CREATE POLICY "Authenticated users can access all transactions" ON transactions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all payment notifications" ON payment_notifications
    FOR ALL USING (auth.role() = 'authenticated');

-- 8. サンプルデータの挿入（テスト用）
INSERT INTO transactions (transaction_id, customer_id, store_id, total_amount, status, items) VALUES
('TXN001', (SELECT id FROM customers LIMIT 1), 'store-001', 8500, 'pending', 
 '[{"name": "バラの花束", "price": 3500, "quantity": 1}, {"name": "花瓶", "price": 5000, "quantity": 1}]'),
('TXN002', (SELECT id FROM customers LIMIT 1), 'store-001', 12000, 'completed',
 '[{"name": "チューリップ", "price": 800, "quantity": 10}, {"name": "花器", "price": 4000, "quantity": 1}]');

-- 9. 決済通知のサンプルデータ
INSERT INTO payment_notifications (transaction_id, customer_id, store_id, amount, payment_method, status, items) VALUES
('TXN002', (SELECT id FROM customers LIMIT 1), 'store-001', 12000, 'クレジットカード', 'completed',
 '[{"name": "チューリップ", "price": 800, "quantity": 10}, {"name": "花器", "price": 4000, "quantity": 1}]');

-- 10. ビューの作成（取引と決済通知を結合）
CREATE OR REPLACE VIEW transaction_summary AS
SELECT 
    t.transaction_id,
    t.customer_id,
    c.name as customer_name,
    c.email as customer_email,
    t.store_id,
    t.total_amount,
    t.status as transaction_status,
    pn.status as payment_status,
    pn.payment_method,
    t.created_at as transaction_created,
    pn.timestamp as payment_timestamp,
    t.items as transaction_items,
    pn.items as payment_items
FROM transactions t
LEFT JOIN customers c ON t.customer_id = c.id
LEFT JOIN payment_notifications pn ON t.transaction_id = pn.transaction_id
ORDER BY t.created_at DESC;

-- 権限設定
GRANT SELECT ON transaction_summary TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON payment_notifications TO authenticated;
