-- 顧客データセキュリティポリシー（認証UID版）
-- 認証のUIDを直接使用してセキュリティを設定

-- 1. お気に入り店舗テーブルのセキュリティ
ALTER TABLE favorite_stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_favorites" ON favorite_stores;
CREATE POLICY "users_own_favorites" ON favorite_stores
  FOR ALL USING (auth.uid() = user_id);

-- 2. レッスン予約テーブルのセキュリティ
ALTER TABLE lesson_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_bookings" ON lesson_bookings;
CREATE POLICY "users_own_bookings" ON lesson_bookings
  FOR ALL USING (auth.uid() = user_id);

-- 3. ポイント履歴テーブルのセキュリティ
ALTER TABLE customer_point_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_point_history" ON customer_point_history;
CREATE POLICY "users_own_point_history" ON customer_point_history
  FOR ALL USING (auth.uid() = user_id);

-- 4. レビューテーブルのセキュリティ
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_reviews" ON customer_reviews;
CREATE POLICY "users_own_reviews" ON customer_reviews
  FOR ALL USING (auth.uid() = user_id);

-- 5. 通知設定テーブルのセキュリティ
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_notifications" ON customer_notifications;
CREATE POLICY "users_own_notifications" ON customer_notifications
  FOR ALL USING (auth.uid() = user_id);

-- 6. 店舗データは全ユーザーが読み取り専用でアクセス可能
DROP POLICY IF EXISTS "users_can_view_stores" ON stores;
CREATE POLICY "users_can_view_stores" ON stores
  FOR SELECT USING (true);

-- 7. レッスンデータは全ユーザーが読み取り専用でアクセス可能
DROP POLICY IF EXISTS "users_can_view_lessons" ON lessons;
CREATE POLICY "users_can_view_lessons" ON lessons
  FOR SELECT USING (true);

-- 8. 顧客テーブルのセキュリティ（既存のcustomersテーブル用）
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_customer_data" ON customers;
CREATE POLICY "users_own_customer_data" ON customers
  FOR ALL USING (auth.uid() = user_id);

-- 9. 監査ログテーブルの作成
CREATE TABLE IF NOT EXISTS customer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 監査ログのトリガー関数
CREATE OR REPLACE FUNCTION log_customer_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customer_audit_log (
    user_id,
    action,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 監査ログトリガーを適用
DROP TRIGGER IF EXISTS customer_audit_trigger ON customers;
CREATE TRIGGER customer_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION log_customer_changes();

-- 12. データベース接続の制限（制約が存在しない場合のみ追加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_email_format' 
    AND table_name = 'customers'
  ) THEN
    ALTER TABLE customers 
    ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;