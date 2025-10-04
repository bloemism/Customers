-- customer_technical_levelsテーブルの外部キー制約を確認・修正

-- 1. 既存の外部キー制約を確認
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'customer_technical_levels';

-- 2. lesson_schoolsテーブルが存在するか確認
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'lesson_schools'
);

-- 3. lesson_schoolsテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS lesson_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. customer_technical_levelsテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS customer_technical_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lesson_school_id UUID NOT NULL REFERENCES lesson_schools(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_level VARCHAR(20) DEFAULT 'BEGINNER' CHECK (current_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  level_achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, lesson_school_id)
);

-- 5. 外部キー制約が存在しない場合は追加
DO $$ 
BEGIN
    -- lesson_school_idの外部キー制約を追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customer_technical_levels_lesson_school_id_fkey'
        AND table_name = 'customer_technical_levels'
    ) THEN
        ALTER TABLE customer_technical_levels 
        ADD CONSTRAINT customer_technical_levels_lesson_school_id_fkey 
        FOREIGN KEY (lesson_school_id) REFERENCES lesson_schools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. テストデータを挿入（存在しない場合のみ）
INSERT INTO lesson_schools (name, description, address, phone, email, website)
VALUES 
  ('フラワーアレンジメントスクールA', '初心者向けのアレンジメントレッスン', '東京都渋谷区', '03-1234-5678', 'info@schoola.com', 'http://schoola.com'),
  ('フラワーデザインスクールB', '上級者向けのデザインレッスン', '東京都新宿区', '03-2345-6789', 'info@schoolb.com', 'http://schoolb.com')
ON CONFLICT (name) DO NOTHING;

-- 7. 顧客の技術レベルデータを挿入（存在しない場合のみ）
DO $$
DECLARE
    customer_uuid UUID;
    school_a_uuid UUID;
    school_b_uuid UUID;
BEGIN
    -- 既存の顧客IDを取得
    SELECT id INTO customer_uuid FROM customers WHERE email = 'botanism2011@gmail.com' LIMIT 1;
    
    -- スクールIDを取得
    SELECT id INTO school_a_uuid FROM lesson_schools WHERE name = 'フラワーアレンジメントスクールA' LIMIT 1;
    SELECT id INTO school_b_uuid FROM lesson_schools WHERE name = 'フラワーデザインスクールB' LIMIT 1;
    
    IF customer_uuid IS NOT NULL THEN
        -- 技術レベルデータを挿入
        INSERT INTO customer_technical_levels (customer_id, lesson_school_id, total_points, current_level)
        VALUES 
          (customer_uuid, school_a_uuid, 150, 'INTERMEDIATE'),
          (customer_uuid, school_b_uuid, 80, 'BEGINNER')
        ON CONFLICT (customer_id, lesson_school_id) DO NOTHING;
    END IF;
END $$;

-- 8. 最終確認
SELECT 
    ctl.id,
    ctl.customer_id,
    ctl.lesson_school_id,
    ls.name as school_name,
    ctl.total_points,
    ctl.current_level
FROM customer_technical_levels ctl
JOIN lesson_schools ls ON ctl.lesson_school_id = ls.id
WHERE ctl.customer_id = (SELECT id FROM customers WHERE email = 'botanism2011@gmail.com' LIMIT 1);
