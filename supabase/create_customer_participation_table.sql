-- 顧客の講座参加管理テーブルを作成
CREATE TABLE IF NOT EXISTS customer_participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(255),
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  participation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 外部キー制約を追加
ALTER TABLE customer_participations 
ADD CONSTRAINT fk_customer_participations_schedule_id 
FOREIGN KEY (schedule_id) REFERENCES new_lesson_schedules(id) ON DELETE CASCADE;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_customer_participations_schedule_id ON customer_participations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_customer_participations_customer_id ON customer_participations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_participations_status ON customer_participations(status);

-- RLS（Row Level Security）を有効化
ALTER TABLE customer_participations ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成（全ユーザーが読み取り可能）
CREATE POLICY "Allow all users to read customer_participations" ON customer_participations
  FOR SELECT USING (true);

-- RLSポリシーを作成（認証されたユーザーが挿入可能）
CREATE POLICY "Allow authenticated users to insert customer_participations" ON customer_participations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLSポリシーを作成（認証されたユーザーが更新可能）
CREATE POLICY "Allow authenticated users to update customer_participations" ON customer_participations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLSポリシーを作成（認証されたユーザーが削除可能）
CREATE POLICY "Allow authenticated users to delete customer_participations" ON customer_participations
  FOR DELETE USING (auth.role() = 'authenticated');

-- サンプルデータを挿入
INSERT INTO customer_participations (
  schedule_id,
  customer_id,
  customer_name,
  customer_email,
  customer_phone,
  status
) VALUES 
(
  (SELECT id FROM new_lesson_schedules LIMIT 1),
  gen_random_uuid(),
  '田中花子',
  'hanako@example.com',
  '090-1234-5678',
  'confirmed'
),
(
  (SELECT id FROM new_lesson_schedules LIMIT 1),
  gen_random_uuid(),
  '佐藤太郎',
  'taro@example.com',
  '090-9876-5432',
  'confirmed'
),
(
  (SELECT id FROM new_lesson_schedules ORDER BY created_at DESC LIMIT 1),
  gen_random_uuid(),
  '山田美咲',
  'misaki@example.com',
  '090-5555-1234',
  'confirmed'
);

-- データ確認
SELECT 
  cp.id,
  cp.schedule_id,
  cp.customer_name,
  cp.customer_email,
  cp.status,
  nls.title as schedule_title,
  nls.date as schedule_date,
  nls.start_time as schedule_start_time
FROM customer_participations cp
LEFT JOIN new_lesson_schedules nls ON cp.schedule_id = nls.id
ORDER BY cp.created_at DESC;
