-- 新しいレッスンデータを安全に追加するスクリプト
-- 既存データは保持し、新しいデータのみ追加

-- 1. 現在のデータ件数を確認
SELECT COUNT(*) as current_count FROM lesson_schools;

-- 2. 新しいレッスンデータを追加（既存データは保持）
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
-- 新しいレッスンデータ1
(
  'フラワーアレンジメントスクール新宿',
  '初心者から上級者まで対応する総合フラワースクール',
  '東京都新宿区新宿3-1-1',
  '03-1234-5678',
  'info@shinjuku-flower.com',
  'https://shinjuku-flower.com',
  '東京都',
  '新宿区',
  35.6909,
  139.7006,
  '田中花子',
  'フラワーアレンジメント歴15年、国際的な資格を持つ講師',
  '生花アレンジメント、プリザーブドフラワー、ドライフラワーアレンジメント',
  ARRAY['月曜日', '水曜日', '金曜日'],
  '10:00-12:00',
  3000,
  8000,
  true
),
-- 新しいレッスンデータ2
(
  '生け花教室銀座',
  '伝統的な生け花を学ぶ教室',
  '東京都中央区銀座1-2-3',
  '03-9876-5432',
  'info@ginza-ikebana.com',
  'https://ginza-ikebana.com',
  '東京都',
  '中央区',
  35.6719,
  139.7656,
  '佐藤美香',
  '池坊流生け花師範、伝統文化継承者',
  '池坊流生け花、小原流生け花、草月流生け花',
  ARRAY['火曜日', '木曜日', '土曜日'],
  '14:00-16:00',
  2500,
  6000,
  true
),
-- 新しいレッスンデータ3
(
  'フラワーデザインスクール渋谷',
  'モダンなフラワーデザインを学ぶ',
  '東京都渋谷区渋谷2-3-4',
  '03-1111-2222',
  'info@shibuya-flower-design.com',
  'https://shibuya-flower-design.com',
  '東京都',
  '渋谷区',
  35.6580,
  139.7016,
  '山田太郎',
  'フラワーデザイナー、コンテスト受賞歴多数',
  'ブーケ制作、コサージュ制作、テーブルフラワー',
  ARRAY['水曜日', '金曜日', '日曜日'],
  '19:00-21:00',
  3500,
  9000,
  true
),
-- 新しいレッスンデータ4
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
-- 新しいレッスンデータ5
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
),
-- 新しいレッスンデータ6
(
  'フラワーアート教室大阪',
  'アート性の高いフラワーアレンジメント',
  '大阪府大阪市北区梅田1-1-1',
  '06-1234-5678',
  'info@osaka-flower-art.com',
  'https://osaka-flower-art.com',
  '大阪府',
  '大阪市北区',
  34.7054,
  135.5003,
  '伊藤美咲',
  'フラワーアーティスト、個展開催歴多数',
  'アートフラワー、モダンアレンジメント、空間演出',
  ARRAY['月曜日', '水曜日', '金曜日'],
  '15:00-17:00',
  4500,
  12000,
  true
);

-- 3. 追加後のデータ件数を確認
SELECT COUNT(*) as new_count FROM lesson_schools;

-- 4. 追加されたデータの確認
SELECT 
  id,
  name,
  prefecture,
  city,
  instructor_name,
  trial_price,
  regular_price,
  is_active,
  created_at
FROM lesson_schools 
ORDER BY created_at DESC
LIMIT 10;

