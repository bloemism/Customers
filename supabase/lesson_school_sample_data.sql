-- レッスンスクール管理画面用サンプルデータ
-- スクール名（屋号のみ）、講座名は含まない
-- 87app Flower Shop Management System

-- 1. レッスンスクールテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS public.lesson_schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- スクール名（屋号）
  prefecture TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  instructor_name TEXT,
  instructor_bio TEXT,
  lesson_content TEXT,
  main_days TEXT[], -- 主要開催日
  main_time TEXT,
  trial_price INTEGER,
  regular_price INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. サンプルデータの挿入（スクール名のみ、講座名なし）
INSERT INTO public.lesson_schools (
  name, prefecture, city, address, email, phone, 
  instructor_name, instructor_bio, lesson_content,
  main_days, main_time, trial_price, regular_price,
  latitude, longitude, is_active
) VALUES 
-- 東京のスクール
(
  'フラワーアカデミー東京',
  '東京都',
  '渋谷区',
  '東京都渋谷区道玄坂1-2-3',
  'tokyo@flower-academy.com',
  '03-1234-5678',
  '田中 花子',
  'フラワーアレンジメント歴15年。NHK文化センター講師経験あり。',
  '基本のアレンジメントから上級テクニックまで、丁寧に指導いたします。',
  ARRAY['土曜日', '日曜日'],
  '10:00-12:00',
  3000,
  8000,
  35.6581,
  139.7016,
  true
),
(
  'ローズガーデンスクール',
  '東京都',
  '新宿区',
  '東京都新宿区新宿3-1-1',
  'info@rose-garden-school.com',
  '03-2345-6789',
  '佐藤 美香',
  'バラ専門のアレンジメント講師。国際コンテスト受賞経験あり。',
  'バラを中心とした上質なアレンジメントを学べます。',
  ARRAY['火曜日', '木曜日'],
  '14:00-16:00',
  3500,
  9000,
  35.6909,
  139.7006,
  true
),
(
  'グリーンライフ教室',
  '東京都',
  '世田谷区',
  '東京都世田谷区三軒茶屋2-1-1',
  'green@life-class.com',
  '03-3456-7890',
  '山田 緑',
  '観葉植物とフラワーアレンジメントの専門家。',
  '観葉植物を活かしたナチュラルなアレンジメントを指導。',
  ARRAY['水曜日', '金曜日'],
  '10:00-12:00',
  2500,
  7000,
  35.6431,
  139.6722,
  true
),

-- 大阪のスクール
(
  '関西フラワーアート',
  '大阪府',
  '大阪市中央区',
  '大阪府大阪市中央区心斎橋筋1-1-1',
  'kansai@flower-art.com',
  '06-1234-5678',
  '大阪 花子',
  '関西で20年、フラワーアレンジメントを指導。',
  '関西らしい明るいアレンジメントを学べます。',
  ARRAY['土曜日', '日曜日'],
  '13:00-15:00',
  2800,
  7500,
  34.6937,
  135.5023,
  true
),
(
  'ハーモニーガーデン',
  '大阪府',
  '大阪市北区',
  '大阪府大阪市北区梅田1-1-1',
  'harmony@garden-school.com',
  '06-2345-6789',
  '梅田 香',
  'ヨーロピアンスタイルのアレンジメント専門。',
  'ヨーロピアンな上品なアレンジメントを指導。',
  ARRAY['火曜日', '木曜日'],
  '15:00-17:00',
  3200,
  8500,
  34.7054,
  135.4903,
  true
),

-- 名古屋のスクール
(
  '中部フラワースタジオ',
  '愛知県',
  '名古屋市',
  '愛知県名古屋市中区栄1-1-1',
  'chubu@flower-studio.com',
  '052-1234-5678',
  '名古屋 花',
  '中部地区で15年、フラワーアレンジメントを指導。',
  '中部地区の花材を活かしたアレンジメントを学べます。',
  ARRAY['水曜日', '土曜日'],
  '10:00-12:00',
  3000,
  8000,
  35.1706,
  136.8816,
  true
),

-- 福岡のスクール
(
  '九州フラワーアカデミー',
  '福岡県',
  '福岡市',
  '福岡県福岡市中央区天神1-1-1',
  'kyushu@flower-academy.com',
  '092-1234-5678',
  '福岡 美花',
  '九州の花材を活かしたアレンジメント専門。',
  '九州の豊富な花材を使ったアレンジメントを指導。',
  ARRAY['金曜日', '日曜日'],
  '14:00-16:00',
  2800,
  7500,
  33.5904,
  130.4017,
  true
),

-- 札幌のスクール
(
  '北海道フラワー教室',
  '北海道',
  '札幌市',
  '北海道札幌市中央区大通西1-1-1',
  'hokkaido@flower-class.com',
  '011-1234-5678',
  '札幌 雪子',
  '北海道の花材を活かしたアレンジメント専門。',
  '北海道の季節の花材を使ったアレンジメントを学べます。',
  ARRAY['土曜日'],
  '10:00-12:00',
  2500,
  7000,
  43.0642,
  141.3469,
  true
),

-- 仙台のスクール
(
  '東北フラワーアート',
  '宮城県',
  '仙台市',
  '宮城県仙台市青葉区一番町1-1-1',
  'tohoku@flower-art.com',
  '022-1234-5678',
  '仙台 花音',
  '東北の花材を活かしたアレンジメント専門。',
  '東北の豊かな自然を活かしたアレンジメントを指導。',
  ARRAY['日曜日'],
  '13:00-15:00',
  2700,
  7200,
  38.2682,
  140.8694,
  true
),

-- 広島のスクール
(
  '中国フラワースクール',
  '広島県',
  '広島市',
  '広島県広島市中区紙屋町1-1-1',
  'chugoku@flower-school.com',
  '082-1234-5678',
  '広島 花美',
  '中国地方の花材を活かしたアレンジメント専門。',
  '中国地方の花材を使ったアレンジメントを学べます。',
  ARRAY['土曜日'],
  '15:00-17:00',
  2600,
  6800,
  34.3853,
  132.4553,
  true
);

-- 3. 権限設定
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_schools TO authenticated;

-- 4. インデックス作成
CREATE INDEX IF NOT EXISTS idx_lesson_schools_prefecture ON public.lesson_schools(prefecture);
CREATE INDEX IF NOT EXISTS idx_lesson_schools_city ON public.lesson_schools(city);
CREATE INDEX IF NOT EXISTS idx_lesson_schools_is_active ON public.lesson_schools(is_active);

-- 5. 完了メッセージ
SELECT 'レッスンスクール管理画面用サンプルデータが正常に作成されました。' as message;
