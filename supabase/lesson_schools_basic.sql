-- レッスンスクール管理用テーブル作成（基本版）

-- 地域分類テーブル
CREATE TABLE IF NOT EXISTS region_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  prefectures TEXT[] NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レッスンスクールテーブル
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サンプル地域データの挿入
INSERT INTO region_categories (name, prefectures, display_order) VALUES
('北海道・東北', ARRAY['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'], 1),
('関東', ARRAY['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '神奈川県'], 2),
('東京', ARRAY['東京都'], 3),
('中部', ARRAY['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'], 4),
('近畿', ARRAY['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'], 5),
('中国・四国', ARRAY['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県'], 6),
('九州・沖縄', ARRAY['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'], 7)
ON CONFLICT (name) DO NOTHING;

