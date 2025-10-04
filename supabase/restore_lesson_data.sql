-- レッスンデータの復元スクリプト
-- lesson_schoolsテーブルにテストデータを挿入

-- 1. 既存のデータを確認
SELECT COUNT(*) as existing_count FROM lesson_schools;

-- 2. テストデータを挿入（既存データがない場合のみ）
INSERT INTO lesson_schools (
  name,
  description,
  address,
  phone,
  email,
  website,
  prefecture,
  city,
  latitude,
  longitude,
  instructor_name,
  instructor_bio,
  lesson_content,
  main_days,
  main_time,
  trial_price,
  regular_price,
  is_active
) VALUES 
(
  'フラワーアレンジメントスクール東京',
  '初心者から上級者まで対応する総合フラワースクール',
  '東京都渋谷区恵比寿1-2-3',
  '03-1234-5678',
  'info@tokyo-flower-school.com',
  'https://tokyo-flower-school.com',
  '東京都',
  '渋谷区',
  35.6762,
  139.6503,
  '田中花子',
  'フラワーアレンジメント歴15年、国際的な資格を持つ講師',
  '生花アレンジメント、プリザーブドフラワー、ドライフラワーアレンジメント',
  ARRAY['月曜日', '水曜日', '金曜日'],
  '10:00-12:00',
  3000,
  8000,
  true
),
(
  '生け花教室京都',
  '伝統的な生け花を学ぶ教室',
  '京都府京都市下京区四条通烏丸東入ル',
  '075-987-6543',
  'info@kyoto-ikebana.com',
  'https://kyoto-ikebana.com',
  '京都府',
  '京都市下京区',
  35.0116,
  135.7681,
  '佐藤美香',
  '池坊流生け花師範、伝統文化継承者',
  '池坊流生け花、小原流生け花、草月流生け花',
  ARRAY['火曜日', '木曜日', '土曜日'],
  '14:00-16:00',
  2500,
  6000,
  true
),
(
  'フラワーデザインスクール大阪',
  'モダンなフラワーデザインを学ぶ',
  '大阪府大阪市北区梅田1-1-1',
  '06-1234-5678',
  'info@osaka-flower-design.com',
  'https://osaka-flower-design.com',
  '大阪府',
  '大阪市北区',
  34.7054,
  135.5003,
  '山田太郎',
  'フラワーデザイナー、コンテスト受賞歴多数',
  'ブーケ制作、コサージュ制作、テーブルフラワー',
  ARRAY['水曜日', '金曜日', '日曜日'],
  '19:00-21:00',
  3500,
  9000,
  true
),
(
  'プリザーブドフラワー教室横浜',
  'プリザーブドフラワーの専門教室',
  '神奈川県横浜市西区みなとみらい2-2-1',
  '045-123-4567',
  'info@yokohama-preserved.com',
  'https://yokohama-preserved.com',
  '神奈川県',
  '横浜市西区',
  35.4658,
  139.6204,
  '鈴木恵',
  'プリザーブドフラワーアーティスト、作品展示多数',
  'プリザーブドフラワーアレンジメント、リース制作',
  ARRAY['月曜日', '水曜日', '土曜日'],
  '13:00-15:00',
  4000,
  10000,
  true
),
(
  'ドライフラワーアトリエ名古屋',
  'ドライフラワーを使ったアレンジメント',
  '愛知県名古屋市中区栄2-3-4',
  '052-123-4567',
  'info@nagoya-dry-flower.com',
  'https://nagoya-dry-flower.com',
  '愛知県',
  '名古屋市中区',
  35.1706,
  136.8816,
  '高橋花',
  'ドライフラワーアーティスト、自然素材の専門家',
  'ドライフラワーアレンジメント、ハーバリウム制作',
  ARRAY['火曜日', '木曜日', '日曜日'],
  '10:00-12:00',
  2800,
  7000,
  true
)
ON CONFLICT (name) DO NOTHING;

-- 3. 挿入後のデータ確認
SELECT 
  id,
  name,
  prefecture,
  city,
  instructor_name,
  trial_price,
  regular_price,
  is_active
FROM lesson_schools 
ORDER BY created_at DESC;

-- 4. データ件数の確認
SELECT COUNT(*) as total_count FROM lesson_schools;

