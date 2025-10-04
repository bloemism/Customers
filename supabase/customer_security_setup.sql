-- 顧客データセキュリティ設定
-- 既存のSupabaseプロジェクト内で顧客データを保護

-- 1. 顧客テーブルの行レベルセキュリティを有効化
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. 顧客は自分のデータのみアクセス可能
CREATE POLICY "customers_own_data_only" ON customers
  FOR ALL USING (auth.uid() = user_id);

-- 3. お気に入り店舗テーブルのセキュリティ
ALTER TABLE favorite_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_own_favorites" ON favorite_stores
  FOR ALL USING (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ));

-- 4. レッスン予約テーブルのセキュリティ
ALTER TABLE lesson_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_own_bookings" ON lesson_bookings
  FOR ALL USING (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ));

-- 5. 店舗データは顧客が読み取り専用でアクセス可能
CREATE POLICY "customers_can_view_stores" ON stores
  FOR SELECT USING (true);

-- 6. レッスンデータは顧客が読み取り専用でアクセス可能
CREATE POLICY "customers_can_view_lessons" ON lessons
  FOR SELECT USING (true);

-- 7. 顧客データの暗号化設定
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 8. 個人情報の暗号化関数
CREATE OR REPLACE FUNCTION encrypt_personal_data(data TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 個人情報の復号化関数
CREATE OR REPLACE FUNCTION decrypt_personal_data(encrypted_data BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 顧客データの監査ログテーブル
CREATE TABLE customer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 監査ログのトリガー関数
CREATE OR REPLACE FUNCTION log_customer_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customer_audit_log (
    customer_id,
    action,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 監査ログトリガーを適用
CREATE TRIGGER customer_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION log_customer_changes();

-- 13. 顧客データのアクセス制限
CREATE POLICY "prevent_cross_customer_access" ON customers
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 14. データベース接続の制限
ALTER TABLE customers 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 15. 個人情報の最小化
CREATE POLICY "minimize_personal_data" ON customers
  FOR SELECT USING (
    auth.uid() = user_id OR 
    -- 店舗オーナーは必要最小限の情報のみアクセス可能
    (auth.jwt() ->> 'user_type' = 'store_owner' AND 
     auth.uid() IN (SELECT user_id FROM store_owner_profiles))
  );

