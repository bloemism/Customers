-- 顧客用テーブルの作成（安全版）
-- 既存のテーブル構造を確認してから実行

-- 1. お気に入り店舗テーブル（外部キー制約なしで作成）
CREATE TABLE IF NOT EXISTS favorite_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  store_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, store_id)
);

-- 2. レッスン予約テーブル（外部キー制約なしで作成）
CREATE TABLE IF NOT EXISTS lesson_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 顧客のポイント履歴テーブル
CREATE TABLE IF NOT EXISTS customer_point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  points_change INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  store_id UUID,
  transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 顧客のレビューテーブル
CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  store_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 顧客の通知設定テーブル
CREATE TABLE IF NOT EXISTS customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_favorite_stores_customer_id ON favorite_stores(customer_id);
CREATE INDEX IF NOT EXISTS idx_favorite_stores_store_id ON favorite_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_customer_id ON lesson_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_lesson_id ON lesson_bookings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_booking_date ON lesson_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_point_history_customer_id ON customer_point_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON customer_point_history(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON customer_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON customer_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON customer_notifications(customer_id);

-- 7. 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの適用
CREATE TRIGGER update_favorite_stores_updated_at
  BEFORE UPDATE ON favorite_stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_bookings_updated_at
  BEFORE UPDATE ON lesson_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_reviews_updated_at
  BEFORE UPDATE ON customer_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_notifications_updated_at
  BEFORE UPDATE ON customer_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

