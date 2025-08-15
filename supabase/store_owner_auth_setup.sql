-- Store Owner Authentication System
-- 87app Flower Shop Management System

-- Drop existing tables if they exist (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS store_owner_profiles CASCADE;
DROP TABLE IF EXISTS store_owner_sessions CASCADE;

-- 1. Store Owner Profiles Table (auth.usersと連携)
CREATE TABLE store_owner_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    store_name VARCHAR(200),
    owner_name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    business_license_number VARCHAR(50) -- 事業者登録番号
    business_type VARCHAR(50) DEFAULT 'florist', -- 事業種別
    is_verified BOOLEAN DEFAULT false, -- 本人確認済みかどうか
    is_active BOOLEAN DEFAULT true, -- アカウント有効かどうか
    subscription_plan VARCHAR(20) DEFAULT 'free', -- プラン: free, basic, premium
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- メールアドレスは必須
    CONSTRAINT email_required CHECK (email IS NOT NULL AND email != '')
);

-- 2. Store Owner Sessions Table (セッション管理)
CREATE TABLE store_owner_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT, -- デバイス情報
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_store_owner_profiles_user_id ON store_owner_profiles(user_id);
CREATE INDEX idx_store_owner_profiles_email ON store_owner_profiles(email);
CREATE INDEX idx_store_owner_profiles_store_name ON store_owner_profiles(store_name);
CREATE INDEX idx_store_owner_profiles_is_active ON store_owner_profiles(is_active);
CREATE INDEX idx_store_owner_sessions_user_id ON store_owner_sessions(user_id);
CREATE INDEX idx_store_owner_sessions_token ON store_owner_sessions(session_token);
CREATE INDEX idx_store_owner_sessions_expires_at ON store_owner_sessions(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE store_owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_owner_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for store_owner_profiles
-- 店舗オーナーは自分のプロフィールのみアクセス可能
CREATE POLICY "Store owners can view own profile" ON store_owner_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Store owners can update own profile" ON store_owner_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Store owners can insert own profile" ON store_owner_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理者は全プロフィールにアクセス可能
CREATE POLICY "Admins can access all profiles" ON store_owner_profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS Policies for store_owner_sessions
-- 店舗オーナーは自分のセッションのみアクセス可能
CREATE POLICY "Store owners can view own sessions" ON store_owner_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Store owners can insert own sessions" ON store_owner_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Store owners can update own sessions" ON store_owner_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Store owners can delete own sessions" ON store_owner_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for automatic updated_at column update
CREATE OR REPLACE FUNCTION update_store_owner_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_owner_profiles_updated_at 
    BEFORE UPDATE ON store_owner_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_store_owner_updated_at_column();

-- Function to create store owner profile after user registration
CREATE OR REPLACE FUNCTION handle_new_store_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO store_owner_profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically create profile when new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_store_owner();

-- Function to update last_login_at
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE store_owner_profiles 
    SET last_login_at = NOW()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update last_login_at when session is created
CREATE TRIGGER on_session_created
    AFTER INSERT ON store_owner_sessions
    FOR EACH ROW EXECUTE FUNCTION update_last_login();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM store_owner_sessions 
    WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Create a scheduled job to clean up expired sessions (PostgreSQL 13+)
-- SELECT cron.schedule('cleanup-expired-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');

-- Function to get store owner with store details
CREATE OR REPLACE FUNCTION get_store_owner_with_store(owner_email VARCHAR)
RETURNS TABLE (
    owner_id UUID,
    owner_email VARCHAR,
    store_name VARCHAR,
    owner_name VARCHAR,
    phone VARCHAR,
    address TEXT,
    business_license_number VARCHAR,
    is_verified BOOLEAN,
    is_active BOOLEAN,
    subscription_plan VARCHAR,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    store_id UUID,
    store_address TEXT,
    store_latitude DECIMAL,
    store_longitude DECIMAL,
    store_phone VARCHAR,
    store_email VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sop.id as owner_id,
        sop.email as owner_email,
        sop.store_name,
        sop.owner_name,
        sop.phone,
        sop.address,
        sop.business_license_number,
        sop.is_verified,
        sop.is_active,
        sop.subscription_plan,
        sop.subscription_expires_at,
        sop.last_login_at,
        s.id as store_id,
        s.address as store_address,
        s.latitude as store_latitude,
        s.longitude as store_longitude,
        s.phone as store_phone,
        s.email as store_email
    FROM store_owner_profiles sop
    LEFT JOIN stores s ON sop.user_id = s.user_id
    WHERE sop.email = owner_email AND sop.is_active = true;
END;
$$ language 'plpgsql';

-- Function to verify store owner
CREATE OR REPLACE FUNCTION verify_store_owner(owner_email VARCHAR, verification_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    is_verified BOOLEAN := false;
BEGIN
    -- 実際の実装では、verification_codeを検証するロジックを追加
    -- ここでは簡易的にtrueを返す
    UPDATE store_owner_profiles 
    SET is_verified = true
    WHERE email = owner_email;
    
    GET DIAGNOSTICS is_verified = ROW_COUNT;
    RETURN is_verified > 0;
END;
$$ language 'plpgsql';

-- Function to update subscription
CREATE OR REPLACE FUNCTION update_store_owner_subscription(
    owner_email VARCHAR,
    new_plan VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := false;
BEGIN
    UPDATE store_owner_profiles 
    SET 
        subscription_plan = new_plan,
        subscription_expires_at = expires_at,
        updated_at = NOW()
    WHERE email = owner_email;
    
    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$ language 'plpgsql';

-- Create View for Store Owner Dashboard
CREATE VIEW store_owner_dashboard AS
SELECT 
    sop.id as owner_id,
    sop.email,
    sop.store_name,
    sop.owner_name,
    sop.is_verified,
    sop.is_active,
    sop.subscription_plan,
    sop.subscription_expires_at,
    sop.last_login_at,
    sop.created_at as registration_date,
    s.id as store_id,
    s.store_name as actual_store_name,
    s.address as store_address,
    s.latitude,
    s.longitude,
    -- 統計情報
    (SELECT COUNT(*) FROM store_services WHERE store_id = s.id) as service_count,
    (SELECT COUNT(*) FROM store_photos WHERE store_id = s.id) as photo_count,
    (SELECT COUNT(*) FROM store_recommended_flowers WHERE store_id = s.id) as flower_count,
    (SELECT COUNT(*) FROM store_posts WHERE store_id = s.id AND is_active = true) as active_posts_count
FROM store_owner_profiles sop
LEFT JOIN stores s ON sop.user_id = s.user_id;

-- Add Comments
COMMENT ON TABLE store_owner_profiles IS 'Store owner profiles table';
COMMENT ON TABLE store_owner_sessions IS 'Store owner sessions table';
COMMENT ON FUNCTION handle_new_store_owner() IS 'Creates store owner profile when user signs up';
COMMENT ON FUNCTION update_last_login() IS 'Updates last login timestamp';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Cleans up expired sessions';
COMMENT ON FUNCTION get_store_owner_with_store(VARCHAR) IS 'Gets store owner with store details';
COMMENT ON FUNCTION verify_store_owner(VARCHAR, VARCHAR) IS 'Verifies store owner account';
COMMENT ON FUNCTION update_store_owner_subscription(VARCHAR, VARCHAR, TIMESTAMP WITH TIME ZONE) IS 'Updates store owner subscription';
COMMENT ON VIEW store_owner_dashboard IS 'Store owner dashboard view';

-- Insert Sample Data
INSERT INTO store_owner_profiles (user_id, email, store_name, owner_name, phone, address, business_license_number, is_verified, subscription_plan) VALUES
('00000000-0000-0000-0000-000000000001', 'sakura@example.com', '花のアトリエ サクラ', '田中 花子', '03-1234-5678', '東京都渋谷区1-1-1', 'T123456789', true, 'premium'),
('00000000-0000-0000-0000-000000000002', 'rose@example.com', 'フラワーショップ ローズ', '山田 太郎', '06-9876-5432', '大阪府大阪市2-2-2', 'O987654321', true, 'basic'),
('00000000-0000-0000-0000-000000000003', 'yuri@example.com', '花工房 ユリ', '佐藤 美咲', '092-5555-1234', '福岡県福岡市3-3-3', 'F555123456', false, 'free');

-- Sample Sessions
INSERT INTO store_owner_sessions (user_id, session_token, device_info, ip_address, user_agent, expires_at) VALUES
('00000000-0000-0000-0000-000000000001', 'session_token_1', 'iPhone 14', '192.168.1.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', NOW() + INTERVAL '7 days'),
('00000000-0000-0000-0000-000000000002', 'session_token_2', 'MacBook Pro', '192.168.1.2', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() + INTERVAL '7 days');

-- Completion Message
SELECT 'Store owner authentication system created successfully.' as message;

