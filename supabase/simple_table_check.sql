-- 簡単なテーブル存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%lesson%'
ORDER BY table_name;

-- もしテーブルが存在しない場合、作成する
CREATE TABLE IF NOT EXISTS lesson_schools (
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

-- 地域分類テーブルも作成
CREATE TABLE IF NOT EXISTS region_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  prefectures TEXT[] NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レッスンスケジュールテーブルも作成
CREATE TABLE IF NOT EXISTS lesson_schedules (
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

-- 生徒予約テーブルも作成
CREATE TABLE IF NOT EXISTS student_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES lesson_schedules(id) ON DELETE CASCADE,
  student_name VARCHAR(100) NOT NULL,
  student_email VARCHAR(255),
  student_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  qr_code_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 基本的な権限設定
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- RLSを有効化
ALTER TABLE lesson_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_categories ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー
CREATE POLICY "Anyone can view active lesson schools" ON lesson_schools
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own lesson schools" ON lesson_schools
  FOR ALL USING (store_email = auth.jwt() ->> 'email');

CREATE POLICY "Anyone can view region categories" ON region_categories
  FOR SELECT USING (true);

-- 地域分類のサンプルデータを挿入
INSERT INTO region_categories (name, prefectures, display_order) VALUES
('北海道・東北', ARRAY['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'], 1),
('関東', ARRAY['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '神奈川県'], 2),
('東京', ARRAY['東京都'], 3),
('中部', ARRAY['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'], 4),
('近畿', ARRAY['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'], 5),
('中国・四国', ARRAY['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県'], 6),
('九州・沖縄', ARRAY['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'], 7)
ON CONFLICT (name) DO NOTHING;

-- 確認クエリ
SELECT 'lesson_schools' as table_name, COUNT(*) as count FROM lesson_schools
UNION ALL
SELECT 'lesson_schedules' as table_name, COUNT(*) as count FROM lesson_schedules
UNION ALL
SELECT 'student_reservations' as table_name, COUNT(*) as count FROM student_reservations
UNION ALL
SELECT 'region_categories' as table_name, COUNT(*) as count FROM region_categories;
