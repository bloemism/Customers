-- 顧客参加情報テーブルの作成
-- レッスンスケジュールへの顧客参加を管理

CREATE TABLE IF NOT EXISTS customer_participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL,
  customer_id UUID,
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  participation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  qr_code_data TEXT, -- QRコードスキャン時のデータ
  notes TEXT, -- 備考
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 外部キー制約（new_lesson_schedulesテーブルとの関連）
ALTER TABLE customer_participations 
ADD CONSTRAINT fk_customer_participations_schedule_id 
FOREIGN KEY (schedule_id) REFERENCES new_lesson_schedules(id) ON DELETE CASCADE;

-- 外部キー制約（customersテーブルとの関連、オプション）
ALTER TABLE customer_participations 
ADD CONSTRAINT fk_customer_participations_customer_id 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_customer_participations_schedule_id ON customer_participations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_customer_participations_customer_id ON customer_participations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_participations_customer_email ON customer_participations(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_participations_status ON customer_participations(status);
CREATE INDEX IF NOT EXISTS idx_customer_participations_participation_date ON customer_participations(participation_date);

-- 更新日時の自動更新用トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_customer_participations_updated_at 
  BEFORE UPDATE ON customer_participations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- 権限設定
GRANT ALL ON customer_participations TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 参加者数更新用の関数
CREATE OR REPLACE FUNCTION update_schedule_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 参加者数を更新
  UPDATE new_lesson_schedules 
  SET current_participants = (
    SELECT COUNT(*) 
    FROM customer_participations 
    WHERE schedule_id = COALESCE(NEW.schedule_id, OLD.schedule_id)
    AND status = 'confirmed'
  )
  WHERE id = COALESCE(NEW.schedule_id, OLD.schedule_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 参加者数更新のトリガー
CREATE TRIGGER trigger_update_schedule_participant_count
  AFTER INSERT OR UPDATE OR DELETE ON customer_participations
  FOR EACH ROW EXECUTE FUNCTION update_schedule_participant_count();

-- サンプルデータを挿入（テスト用）
INSERT INTO customer_participations (
  schedule_id,
  customer_name,
  customer_email,
  customer_phone,
  status,
  notes
) VALUES 
(
  (SELECT id FROM new_lesson_schedules WHERE title = 'フラワーアレンジメント基礎講座' LIMIT 1),
  '田中花子',
  'tanaka@example.com',
  '090-1234-5678',
  'confirmed',
  '初回参加'
),
(
  (SELECT id FROM new_lesson_schedules WHERE title = 'フラワーアレンジメント基礎講座' LIMIT 1),
  '佐藤太郎',
  'sato@example.com',
  '090-9876-5432',
  'confirmed',
  'リピーター'
),
(
  (SELECT id FROM new_lesson_schedules WHERE title = 'ブーケ制作講座' LIMIT 1),
  '山田美咲',
  'yamada@example.com',
  '090-5555-1234',
  'confirmed',
  'ウェディング準備'
);

-- データ確認
SELECT 
  cp.id,
  cp.schedule_id,
  nls.title as lesson_title,
  cp.customer_name,
  cp.customer_email,
  cp.customer_phone,
  cp.status,
  cp.participation_date,
  cp.notes
FROM customer_participations cp
LEFT JOIN new_lesson_schedules nls ON cp.schedule_id = nls.id
ORDER BY cp.participation_date DESC;
