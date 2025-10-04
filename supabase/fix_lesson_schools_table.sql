-- lesson_schoolsテーブルの修正とデータ復元

-- 1. 既存のlesson_schoolsテーブルをバックアップ（データがある場合）
CREATE TABLE IF NOT EXISTS lesson_schools_backup AS 
SELECT * FROM lesson_schools WHERE 1=0;

-- 既存データをバックアップ
INSERT INTO lesson_schools_backup 
SELECT * FROM lesson_schools;

-- 2. 既存のテーブルと関連するテーブルを削除
DROP TABLE IF EXISTS lesson_schedules CASCADE;
DROP TABLE IF EXISTS student_reservations CASCADE;
DROP TABLE IF EXISTS lesson_schools CASCADE;

-- 3. lesson_schoolsテーブルを再作成（正しい構造で）
CREATE TABLE lesson_schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_email VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  prefecture VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(50),
  instructor_name VARCHAR(100),
  instructor_bio TEXT,
  lesson_content TEXT,
  main_days TEXT[] DEFAULT '{}',
  main_time VARCHAR(100),
  trial_price INTEGER DEFAULT 0,
  regular_price INTEGER DEFAULT 0,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. lesson_schedulesテーブルを再作成
CREATE TABLE lesson_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_school_id UUID NOT NULL REFERENCES lesson_schools(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. student_reservationsテーブルを再作成
CREATE TABLE student_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_schedule_id UUID NOT NULL REFERENCES lesson_schedules(id) ON DELETE CASCADE,
  student_name VARCHAR(100) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  student_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. インデックスの作成
CREATE INDEX idx_lesson_schools_store_email ON lesson_schools(store_email);
CREATE INDEX idx_lesson_schools_location ON lesson_schools(latitude, longitude);
CREATE INDEX idx_lesson_schools_active ON lesson_schools(is_active);
CREATE INDEX idx_lesson_schedules_school_id ON lesson_schedules(lesson_school_id);
CREATE INDEX idx_lesson_schedules_date ON lesson_schedules(date);
CREATE INDEX idx_student_reservations_schedule_id ON student_reservations(lesson_schedule_id);

-- 7. 更新日時の自動更新トリガーを作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの適用
DROP TRIGGER IF EXISTS update_lesson_schools_updated_at ON lesson_schools;
CREATE TRIGGER update_lesson_schools_updated_at
  BEFORE UPDATE ON lesson_schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_schedules_updated_at ON lesson_schedules;
CREATE TRIGGER update_lesson_schedules_updated_at
  BEFORE UPDATE ON lesson_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_reservations_updated_at ON student_reservations;
CREATE TRIGGER update_student_reservations_updated_at
  BEFORE UPDATE ON student_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. RLSポリシーの設定
ALTER TABLE lesson_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reservations ENABLE ROW LEVEL SECURITY;

-- lesson_schoolsのRLSポリシー
DROP POLICY IF EXISTS "Users can view all lesson schools" ON lesson_schools;
CREATE POLICY "Users can view all lesson schools" ON lesson_schools FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage their lesson schools" ON lesson_schools;
CREATE POLICY "Store owners can manage their lesson schools" ON lesson_schools 
FOR ALL USING (
  store_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- lesson_schedulesのRLSポリシー
DROP POLICY IF EXISTS "Users can view all lesson schedules" ON lesson_schedules;
CREATE POLICY "Users can view all lesson schedules" ON lesson_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage their lesson schedules" ON lesson_schedules;
CREATE POLICY "Store owners can manage their lesson schedules" ON lesson_schedules 
FOR ALL USING (
  lesson_school_id IN (
    SELECT id FROM lesson_schools WHERE store_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- student_reservationsのRLSポリシー
DROP POLICY IF EXISTS "Users can view all student reservations" ON student_reservations;
CREATE POLICY "Users can view all student reservations" ON student_reservations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage their student reservations" ON student_reservations;
CREATE POLICY "Store owners can manage their student reservations" ON student_reservations 
FOR ALL USING (
  lesson_schedule_id IN (
    SELECT ls.id FROM lesson_schedules ls
    JOIN lesson_schools lsc ON ls.lesson_school_id = lsc.id
    WHERE lsc.store_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- 9. バックアップからデータを復元（データがある場合）
INSERT INTO lesson_schools 
SELECT * FROM lesson_schools_backup 
WHERE EXISTS (SELECT 1 FROM lesson_schools_backup LIMIT 1);

-- 10. テストデータの挿入（データがない場合）
INSERT INTO lesson_schools (
  store_email, name, prefecture, city, address, email, phone,
  instructor_name, instructor_bio, lesson_content, main_days, main_time,
  trial_price, regular_price, latitude, longitude, is_active
) VALUES 
(
  'botanism2011@gmail.com',
  'フラワーアレンジメントスクールA',
  '東京都',
  '渋谷区',
  '東京都渋谷区恵比寿1-1-1',
  'info@schoola.com',
  '03-1234-5678',
  '田中花子',
  '10年の経験を持つフラワーアレンジメント講師',
  '初心者向けのアレンジメントレッスン',
  ARRAY['月', '水', '金'],
  '10:00-12:00',
  2000,
  5000,
  35.6581,
  139.7016,
  true
),
(
  'botanism2011@gmail.com',
  '生け花教室B',
  '京都府',
  '京都市',
  '京都府京都市下京区烏丸通四条下ル',
  'info@schoolb.com',
  '075-987-6543',
  '佐藤太郎',
  '伝統的な生け花を指導する経験豊富な講師',
  '伝統的な生け花を学ぶ',
  ARRAY['火', '木', '土'],
  '14:00-16:00',
  1500,
  4000,
  35.0041,
  135.7650,
  true
),
(
  'botanism2011@gmail.com',
  'プリザーブドフラワー教室C',
  '大阪府',
  '大阪市',
  '大阪府大阪市北区梅田1-1-1',
  'info@schoolc.com',
  '06-1111-2222',
  '山田花美',
  'プリザーブドフラワーの専門講師',
  '長期間美しく保つプリザーブドフラワー',
  ARRAY['土', '日'],
  '13:00-15:00',
  2500,
  6000,
  34.6937,
  135.5023,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 11. 確認用クエリ
SELECT 
  'Final Check' as check_type,
  COUNT(*) as total_schools,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_schools
FROM lesson_schools;

