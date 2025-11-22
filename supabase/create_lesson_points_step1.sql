-- ステップ1: レッスンポイント履歴テーブルを作成

CREATE TABLE IF NOT EXISTS customer_lesson_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  schedule_id UUID NOT NULL,
  lesson_title TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 10,
  earned_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_customer_lesson_points_customer_id ON customer_lesson_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_lesson_points_schedule_id ON customer_lesson_points(schedule_id);
CREATE INDEX IF NOT EXISTS idx_customer_lesson_points_earned_date ON customer_lesson_points(earned_date);
