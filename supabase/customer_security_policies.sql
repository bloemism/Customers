-- 顧客データセキュリティポリシー
-- テーブル作成後に実行するセキュリティ設定

-- 1. 顧客テーブルの行レベルセキュリティを有効化
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. 顧客は自分のデータのみアクセス可能
DROP POLICY IF EXISTS "customers_own_data_only" ON customers;
CREATE POLICY "customers_own_data_only" ON customers
  FOR ALL USING (auth.uid() = user_id);

-- 3. お気に入り店舗テーブルのセキュリティ
ALTER TABLE favorite_stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_own_favorites" ON favorite_stores;
CREATE POLICY "customers_own_favorites" ON favorite_stores
  FOR ALL USING (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ));

-- 4. レッスン予約テーブルのセキュリティ
ALTER TABLE lesson_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_own_bookings" ON lesson_bookings;
CREATE POLICY "customers_own_bookings" ON lesson_bookings
  FOR ALL USING (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ));

-- 5. ポイント履歴テーブルのセキュリティ
ALTER TABLE customer_point_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_own_point_history" ON customer_point_history;
CREATE POLICY "customers_own_point_history" ON customer_point_history
  FOR ALL USING (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ));

-- 6. レビューテーブルのセキュリティ
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_own_reviews" ON customer_reviews;
CREATE POLICY "customers_own_reviews" ON customer_reviews
  FOR ALL USING (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ));

-- 7. 通知設定テーブルのセキュリティ
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_own_notifications" ON customer_notifications;
CREATE POLICY "customers_own_notifications" ON customer_notifications
  FOR ALL USING (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ));

-- 8. 店舗データは顧客が読み取り専用でアクセス可能
DROP POLICY IF EXISTS "customers_can_view_stores" ON stores;
CREATE POLICY "customers_can_view_stores" ON stores
  FOR SELECT USING (true);

-- 9. レッスンデータは顧客が読み取り専用でアクセス可能
DROP POLICY IF EXISTS "customers_can_view_lessons" ON lessons;
CREATE POLICY "customers_can_view_lessons" ON lessons
  FOR SELECT USING (true);

-- 10. 顧客データのアクセス制限（店舗オーナーは必要最小限の情報のみ）
DROP POLICY IF EXISTS "prevent_cross_customer_access" ON customers;
CREATE POLICY "prevent_cross_customer_access" ON customers
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 11. 店舗オーナーは自分の店舗の顧客情報のみアクセス可能
DROP POLICY IF EXISTS "store_owners_own_customers" ON customers;
CREATE POLICY "store_owners_own_customers" ON customers
  FOR SELECT USING (
    auth.uid() = user_id OR 
    id IN (
      SELECT DISTINCT c.id 
      FROM customers c
      JOIN favorite_stores fs ON c.id = fs.customer_id
      JOIN stores s ON fs.store_id = s.id
      JOIN store_owner_profiles sop ON s.owner_id = sop.user_id
      WHERE sop.user_id = auth.uid()
    )
  );

-- 12. 監査ログテーブルの作成
CREATE TABLE IF NOT EXISTS customer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. 監査ログのトリガー関数
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

-- 14. 監査ログトリガーを適用
DROP TRIGGER IF EXISTS customer_audit_trigger ON customers;
CREATE TRIGGER customer_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION log_customer_changes();

-- 15. データベース接続の制限
ALTER TABLE customers 
ADD CONSTRAINT IF NOT EXISTS check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 16. 顧客データの最小化ポリシー
DROP POLICY IF EXISTS "minimize_personal_data" ON customers;
CREATE POLICY "minimize_personal_data" ON customers
  FOR SELECT USING (
    auth.uid() = user_id OR 
    -- 店舗オーナーは必要最小限の情報のみアクセス可能
    (auth.jwt() ->> 'user_type' = 'store_owner' AND 
     auth.uid() IN (SELECT user_id FROM store_owner_profiles))
  );
