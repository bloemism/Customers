-- Customer Management System Tables
-- 87app Flower Shop Management System

-- 1. Customer Basic Information Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    birth_date DATE,
    gender VARCHAR(10),
    preferred_language VARCHAR(10) DEFAULT 'ja',
    total_points INTEGER DEFAULT 0,
    total_purchase_amount INTEGER DEFAULT 0,
    first_purchase_date TIMESTAMP WITH TIME ZONE,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Email or phone number is required
    CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- 2. Purchase History Table
CREATE TABLE IF NOT EXISTS purchase_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    store_id UUID, -- Store ID (for future store table integration)
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_amount INTEGER NOT NULL, -- Total amount (yen)
    tax_amount INTEGER NOT NULL, -- Tax amount (yen)
    points_earned INTEGER NOT NULL, -- Points earned
    points_used INTEGER DEFAULT 0, -- Points used
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Purchase Items Detail Table
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID REFERENCES purchase_history(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL, -- Item name
    unit_price INTEGER NOT NULL, -- Unit price (yen)
    quantity INTEGER NOT NULL, -- Quantity
    total_price INTEGER NOT NULL, -- Subtotal (yen)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Point Transaction History Table
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'earn' or 'use'
    points INTEGER NOT NULL, -- Points amount
    purchase_id UUID REFERENCES purchase_history(id), -- Related purchase history (when earning)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_purchase_history_customer_id ON purchase_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_date ON purchase_history(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_customer_id ON point_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_date ON point_transactions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Authenticated users can access all data (as store managers)
CREATE POLICY "Store managers can access all customer data" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Store managers can access all purchase history" ON purchase_history
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Store managers can access all purchase items" ON purchase_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Store managers can access all point transactions" ON point_transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger for automatic updated_at column update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for automatic point updates
CREATE OR REPLACE FUNCTION update_customer_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer total points and total purchase amount when purchase history is added
    IF TG_OP = 'INSERT' THEN
        UPDATE customers 
        SET 
            total_points = total_points + NEW.points_earned - NEW.points_used,
            total_purchase_amount = total_purchase_amount + NEW.total_amount,
            last_purchase_date = NEW.purchase_date,
            first_purchase_date = COALESCE(first_purchase_date, NEW.purchase_date)
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_points_trigger
    AFTER INSERT ON purchase_history
    FOR EACH ROW EXECUTE FUNCTION update_customer_points();

-- Create View for Statistics
CREATE OR REPLACE VIEW customer_statistics AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.total_points,
    c.total_purchase_amount,
    c.first_purchase_date,
    c.last_purchase_date,
    -- Purchase count in last 2 months
    COUNT(ph.id) FILTER (WHERE ph.purchase_date >= NOW() - INTERVAL '2 months') as purchases_last_2_months,
    -- Average purchase amount in last month
    AVG(ph.total_amount) FILTER (WHERE ph.purchase_date >= NOW() - INTERVAL '1 month') as avg_purchase_last_month,
    -- Total points used in last month
    SUM(ph.points_used) FILTER (WHERE ph.purchase_date >= NOW() - INTERVAL '1 month') as points_used_last_month,
    -- Total points earned in last month
    SUM(ph.points_earned) FILTER (WHERE ph.purchase_date >= NOW() - INTERVAL '1 month') as points_earned_last_month
FROM customers c
LEFT JOIN purchase_history ph ON c.id = ph.customer_id
GROUP BY c.id, c.name, c.email, c.phone, c.total_points, c.total_purchase_amount, c.first_purchase_date, c.last_purchase_date;

-- Add Comments
COMMENT ON TABLE customers IS 'Customer basic information table';
COMMENT ON TABLE purchase_history IS 'Purchase history table';
COMMENT ON TABLE purchase_items IS 'Purchase items detail table';
COMMENT ON TABLE point_transactions IS 'Point transaction history table';
COMMENT ON VIEW customer_statistics IS 'Customer statistics view';

-- Insert Sample Data
INSERT INTO customers (email, phone, name, address, birth_date, gender, total_points, total_purchase_amount) VALUES
('tanaka@example.com', '090-1234-5678', 'Tanaka Hanako', 'Tokyo Shibuya 1-1-1', '1985-03-15', 'female', 1500, 30000),
('yamada@example.com', '080-9876-5432', 'Yamada Taro', 'Osaka Osaka 2-2-2', '1990-07-22', 'male', 800, 16000),
('sato@example.com', '070-5555-1234', 'Sato Misaki', 'Fukuoka Fukuoka 3-3-3', '1988-11-08', 'female', 2200, 44000),
('suzuki@example.com', '090-7777-8888', 'Suzuki Kenichi', 'Hokkaido Sapporo 4-4-4', '1992-05-30', 'male', 500, 10000),
('watanabe@example.com', '080-1111-2222', 'Watanabe Aiko', 'Aichi Nagoya 5-5-5', '1987-09-12', 'female', 1800, 36000);

-- Sample Purchase History
INSERT INTO purchase_history (customer_id, total_amount, tax_amount, points_earned, points_used, payment_method) VALUES
((SELECT id FROM customers WHERE email = 'tanaka@example.com'), 15000, 1500, 750, 0, 'Credit Card'),
((SELECT id FROM customers WHERE email = 'tanaka@example.com'), 8000, 800, 400, 200, 'Cash'),
((SELECT id FROM customers WHERE email = 'yamada@example.com'), 12000, 1200, 600, 0, 'E-money'),
((SELECT id FROM customers WHERE email = 'sato@example.com'), 22000, 2200, 1100, 500, 'Credit Card'),
((SELECT id FROM customers WHERE email = 'suzuki@example.com'), 5000, 500, 250, 0, 'Cash'),
((SELECT id FROM customers WHERE email = 'watanabe@example.com'), 18000, 1800, 900, 300, 'Credit Card');

-- Sample Purchase Items
INSERT INTO purchase_items (purchase_id, item_name, unit_price, quantity, total_price) VALUES
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'tanaka@example.com') LIMIT 1), 'Red Rose', 500, 20, 10000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'tanaka@example.com') LIMIT 1), 'Pink Carnation', 300, 10, 3000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'tanaka@example.com') LIMIT 1), 'Ribbon', 200, 10, 2000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'yamada@example.com') LIMIT 1), 'Yellow Tulip', 400, 25, 10000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'yamada@example.com') LIMIT 1), 'Vase', 2000, 1, 2000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'sato@example.com') LIMIT 1), 'White Lily', 600, 30, 18000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'sato@example.com') LIMIT 1), 'Wrapping Paper', 400, 10, 4000);

-- Sample Point Transaction History
INSERT INTO point_transactions (customer_id, transaction_type, points, purchase_id, description) VALUES
((SELECT id FROM customers WHERE email = 'tanaka@example.com'), 'earn', 750, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'tanaka@example.com') LIMIT 1), 'Points earned from purchase'),
((SELECT id FROM customers WHERE email = 'tanaka@example.com'), 'earn', 400, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'tanaka@example.com') LIMIT 1 OFFSET 1), 'Points earned from purchase'),
((SELECT id FROM customers WHERE email = 'tanaka@example.com'), 'use', 200, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'tanaka@example.com') LIMIT 1 OFFSET 1), 'Points used for purchase'),
((SELECT id FROM customers WHERE email = 'yamada@example.com'), 'earn', 600, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'yamada@example.com') LIMIT 1), 'Points earned from purchase'),
((SELECT id FROM customers WHERE email = 'sato@example.com'), 'earn', 1100, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'sato@example.com') LIMIT 1), 'Points earned from purchase'),
((SELECT id FROM customers WHERE email = 'sato@example.com'), 'use', 500, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'sato@example.com') LIMIT 1), 'Points used for purchase');

-- Completion Message
SELECT 'Customer management system tables created successfully.' as message;
