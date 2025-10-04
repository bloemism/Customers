-- 技術レベル関連データの確認と修正

-- 1. 現在のcustomersデータを確認
SELECT 
  id,
  user_id,
  email,
  name
FROM customers 
WHERE email = 'botanism2011@gmail.com';

-- 2. customer_technical_levelsテーブルの存在確認
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'customer_technical_levels'
ORDER BY ordinal_position;

-- 3. lesson_schoolsテーブルの存在確認
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 4. 既存の技術レベルデータを確認
SELECT 
  ctl.id,
  ctl.customer_id,
  ctl.lesson_school_id,
  ctl.total_points,
  ctl.current_level,
  c.name as customer_name,
  ls.name as school_name
FROM customer_technical_levels ctl
LEFT JOIN customers c ON ctl.customer_id = c.id
LEFT JOIN lesson_schools ls ON ctl.lesson_school_id = ls.id;

-- 5. もしデータが存在しない場合は、テストデータを作成
-- まず、customersテーブルから正しいIDを取得
DO $$
DECLARE
    customer_uuid UUID;
    school1_uuid UUID := '550e8400-e29b-41d4-a716-446655440001';
    school2_uuid UUID := '550e8400-e29b-41d4-a716-446655440002';
BEGIN
    -- customersテーブルからIDを取得
    SELECT id INTO customer_uuid 
    FROM customers 
    WHERE email = 'botanism2011@gmail.com' 
    LIMIT 1;
    
    IF customer_uuid IS NOT NULL THEN
        -- 技術レベルデータを挿入（存在しない場合のみ）
        INSERT INTO customer_technical_levels (customer_id, lesson_school_id, total_points, current_level)
        VALUES 
          (customer_uuid, school1_uuid, 150, 'INTERMEDIATE'),
          (customer_uuid, school2_uuid, 80, 'BEGINNER')
        ON CONFLICT (customer_id, lesson_school_id) DO NOTHING;
        
        RAISE NOTICE '技術レベルデータを挿入しました。顧客ID: %', customer_uuid;
    ELSE
        RAISE NOTICE '顧客データが見つかりません。';
    END IF;
END $$;

-- 6. 最終確認
SELECT 
  ctl.id,
  ctl.customer_id,
  ctl.lesson_school_id,
  ctl.total_points,
  ctl.current_level,
  c.name as customer_name,
  c.email as customer_email,
  ls.name as school_name
FROM customer_technical_levels ctl
JOIN customers c ON ctl.customer_id = c.id
JOIN lesson_schools ls ON ctl.lesson_school_id = ls.id
WHERE c.email = 'botanism2011@gmail.com';


