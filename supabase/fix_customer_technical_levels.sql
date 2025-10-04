-- customer_technical_levelsテーブルの修正

-- 1. 既存のcustomer_technical_levelsテーブルを削除（存在する場合）
DROP TABLE IF EXISTS customer_technical_levels CASCADE;

-- 2. customer_technical_levelsテーブルを正しく作成
CREATE TABLE customer_technical_levels (
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

-- 3. customer_point_historyテーブルも修正
DROP TABLE IF EXISTS customer_point_history CASCADE;

CREATE TABLE customer_point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lesson_school_id UUID REFERENCES lesson_schools(id) ON DELETE SET NULL,
  points_change INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_customer_technical_levels_customer_id ON customer_technical_levels(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_technical_levels_school_id ON customer_technical_levels(lesson_school_id);
CREATE INDEX IF NOT EXISTS idx_customer_point_history_customer_id ON customer_point_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_point_history_created_at ON customer_point_history(created_at);

-- 5. 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの適用
DROP TRIGGER IF EXISTS update_customer_technical_levels_updated_at ON customer_technical_levels;
CREATE TRIGGER update_customer_technical_levels_updated_at
  BEFORE UPDATE ON customer_technical_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RLSを無効化（テスト用）
ALTER TABLE customer_technical_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_history DISABLE ROW LEVEL SECURITY;

-- 7. テスト用のデータを挿入
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
        -- 技術レベルデータを挿入
        INSERT INTO customer_technical_levels (customer_id, lesson_school_id, total_points, current_level)
        VALUES 
          (customer_uuid, school1_uuid, 150, 'INTERMEDIATE'),
          (customer_uuid, school2_uuid, 80, 'BEGINNER');
        
        -- ポイント履歴データを挿入
        INSERT INTO customer_point_history (customer_id, lesson_school_id, points_change, reason, description)
        VALUES 
          (customer_uuid, school1_uuid, 50, 'レッスン参加', '基礎フラワーアレンジメントレッスン'),
          (customer_uuid, school1_uuid, 30, '課題提出', '季節のアレンジメント課題'),
          (customer_uuid, school1_uuid, 70, 'レッスン参加', '上級フラワーアレンジメントレッスン'),
          (customer_uuid, school2_uuid, 40, 'レッスン参加', 'ガーデンデザイン基礎レッスン'),
          (customer_uuid, school2_uuid, 40, 'レッスン参加', '庭園デザイン実践レッスン');
        
        RAISE NOTICE '技術レベルデータを挿入しました。顧客ID: %', customer_uuid;
    ELSE
        RAISE NOTICE '顧客データが見つかりません。';
    END IF;
END $$;

-- 8. 最終確認
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


