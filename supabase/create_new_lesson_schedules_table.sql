-- 新しいレッスンスケジュールテーブルを作成
CREATE TABLE IF NOT EXISTS new_lesson_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_school_id UUID NOT NULL,
  store_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 外部キー制約を追加
ALTER TABLE new_lesson_schedules 
ADD CONSTRAINT fk_new_lesson_schedules_school_id 
FOREIGN KEY (lesson_school_id) REFERENCES lesson_schools(id) ON DELETE CASCADE;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_new_lesson_schedules_school_id ON new_lesson_schedules(lesson_school_id);
CREATE INDEX IF NOT EXISTS idx_new_lesson_schedules_store_email ON new_lesson_schedules(store_email);
CREATE INDEX IF NOT EXISTS idx_new_lesson_schedules_date ON new_lesson_schedules(date);

-- RLS（Row Level Security）を有効化
ALTER TABLE new_lesson_schedules ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成（全ユーザーが読み取り可能）
CREATE POLICY "Allow all users to read new_lesson_schedules" ON new_lesson_schedules
  FOR SELECT USING (true);

-- RLSポリシーを作成（認証されたユーザーが挿入可能）
CREATE POLICY "Allow authenticated users to insert new_lesson_schedules" ON new_lesson_schedules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLSポリシーを作成（認証されたユーザーが更新可能）
CREATE POLICY "Allow authenticated users to update new_lesson_schedules" ON new_lesson_schedules
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLSポリシーを作成（認証されたユーザーが削除可能）
CREATE POLICY "Allow authenticated users to delete new_lesson_schedules" ON new_lesson_schedules
  FOR DELETE USING (auth.role() = 'authenticated');

-- サンプルデータを挿入
INSERT INTO new_lesson_schedules (
  lesson_school_id,
  store_email,
  title,
  description,
  date,
  start_time,
  end_time,
  max_participants,
  price
) VALUES 
(
  'd987cb65-9609-4b91-8983-049567e341e7',
  'deblwinkel@gmail.com',
  'フラワーアレンジメント基礎講座',
  '初心者向けのフラワーアレンジメントの基礎を学ぶ講座です。',
  '2025-01-15',
  '10:00:00',
  '12:00:00',
  10,
  5000
),
(
  'd987cb65-9609-4b91-8983-049567e341e7',
  'deblwinkel@gmail.com',
  'ブーケ制作講座',
  'ウェディングブーケの制作方法を学ぶ講座です。',
  '2025-01-20',
  '14:00:00',
  '16:00:00',
  8,
  8000
),
(
  '70fc8eb8-cf6f-4460-9444-9de8ec7afb64',
  'deblwinkel@gmail.com',
  'リース制作講座',
  'クリスマスリースの制作方法を学ぶ講座です。',
  '2025-01-25',
  '10:00:00',
  '12:00:00',
  12,
  6000
);

-- データ確認
SELECT 
  nls.id,
  nls.lesson_school_id,
  nls.store_email,
  nls.title,
  nls.date,
  nls.start_time,
  nls.end_time,
  nls.max_participants,
  nls.price,
  ls.name as school_name
FROM new_lesson_schedules nls
LEFT JOIN lesson_schools ls ON nls.lesson_school_id = ls.id
ORDER BY nls.date, nls.start_time;
