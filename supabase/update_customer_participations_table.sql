-- customer_participationsテーブルをcustomersテーブルと連携するように更新

-- 既存のテーブルを削除（データがある場合は注意）
-- DROP TABLE IF EXISTS customer_participations;

-- 新しいcustomer_participationsテーブルを作成
CREATE TABLE IF NOT EXISTS customer_participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  participation_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_customer_participations_customer_id ON customer_participations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_participations_schedule_id ON customer_participations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_customer_participations_status ON customer_participations(status);

-- RLS設定
ALTER TABLE customer_participations ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "店舗は自分のレッスンの参加情報を管理可能" ON customer_participations
  FOR ALL USING (
    schedule_id IN (
      SELECT id FROM new_lesson_schedules 
      WHERE store_email = auth.jwt() ->> 'email'
    )
  );

-- 顧客は自分の参加情報を読み取り可能
CREATE POLICY "顧客は自分の参加情報を読み取り可能" ON customer_participations
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = auth.jwt() ->> 'email'
    )
  );
