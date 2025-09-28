-- 顧客用テーブルの作成（認証UID連携版）
-- 認証のUIDを直接使用してcustomersテーブルと連携

-- 1. お気に入り店舗テーブル
CREATE TABLE IF NOT EXISTS favorite_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- 2. レッスン予約テーブル
CREATE TABLE IF NOT EXISTS lesson_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id TEXT NOT NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 顧客のポイント履歴テーブル
CREATE TABLE IF NOT EXISTS customer_point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points_change INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  store_id TEXT,
  transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 顧客のレビューテーブル
CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 顧客の通知設定テーブル
CREATE TABLE IF NOT EXISTS customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_favorite_stores_user_id ON favorite_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_stores_store_id ON favorite_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_user_id ON lesson_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_lesson_id ON lesson_bookings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_booking_date ON lesson_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON customer_point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON customer_point_history(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON customer_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON customer_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON customer_notifications(user_id);

-- 7. 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの適用（既存のトリガーを削除してから作成）
DROP TRIGGER IF EXISTS update_favorite_stores_updated_at ON favorite_stores;
CREATE TRIGGER update_favorite_stores_updated_at
  BEFORE UPDATE ON favorite_stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_bookings_updated_at ON lesson_bookings;
CREATE TRIGGER update_lesson_bookings_updated_at
  BEFORE UPDATE ON lesson_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_reviews_updated_at ON customer_reviews;
CREATE TRIGGER update_customer_reviews_updated_at
  BEFORE UPDATE ON customer_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_notifications_updated_at ON customer_notifications;
CREATE TRIGGER update_customer_notifications_updated_at
  BEFORE UPDATE ON customer_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
