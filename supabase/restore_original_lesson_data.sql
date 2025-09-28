-- 元の6件のレッスンデータを復元するスクリプト
-- 実際のデータに置き換えてください

-- 1. 現在のlesson_schoolsテーブルの状況確認
SELECT COUNT(*) as current_count FROM lesson_schools;

-- 2. 元の6件のデータを復元（実際のデータに置き換えてください）
-- 注意: 元のデータの詳細を入力してください
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
-- ここに元の6件のデータを入力してください
-- 例：
-- (
--   '元のスクール名1',
--   '元の説明1',
--   '元の住所1',
--   '元の電話番号1',
--   '元のメール1',
--   '元のウェブサイト1',
--   '元の都道府県1',
--   '元の市区町村1',
--   35.6762,  -- 緯度
--   139.6503, -- 経度
--   '元の講師名1',
--   '元の講師紹介1',
--   '元のレッスン内容1',
--   ARRAY['月曜日', '水曜日'],
--   '10:00-12:00',
--   3000,  -- 体験料金
--   8000,  -- 通常料金
--   true
-- ),
-- ... 残り5件も同様に
;

-- 3. 復元後の確認
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
ORDER BY created_at DESC;

-- 4. 最終件数確認
SELECT COUNT(*) as restored_count FROM lesson_schools;
