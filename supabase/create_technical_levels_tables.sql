-- 技術レベル関連テーブルの作成

-- 1. レッスンスクールテーブル（存在しない場合のみ作成）
CREATE TABLE IF NOT EXISTS lesson_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 顧客技術レベルテーブル
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

-- 3. 顧客ポイント履歴テーブル（詳細版）
CREATE TABLE IF NOT EXISTS customer_point_history (
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
DROP TRIGGER IF EXISTS update_lesson_schools_updated_at ON lesson_schools;
CREATE TRIGGER update_lesson_schools_updated_at
  BEFORE UPDATE ON lesson_schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_technical_levels_updated_at ON customer_technical_levels;
CREATE TRIGGER update_customer_technical_levels_updated_at
  BEFORE UPDATE ON customer_technical_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RLSを無効化（テスト用）
ALTER TABLE lesson_schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_technical_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_history DISABLE ROW LEVEL SECURITY;

-- 7. テスト用のレッスンスクールデータを挿入
INSERT INTO lesson_schools (id, name, description, address, phone, email)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'フラワーアカデミー東京',
    '初心者から上級者まで対応する総合フラワースクール',
    '東京都渋谷区恵比寿1-1-1',
    '03-1234-5678',
    'info@flower-academy-tokyo.com'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'ガーデンデザインスクール',
    'ガーデンデザインとフラワーアレンジメントの専門スクール',
    '東京都港区六本木2-2-2',
    '03-2345-6789',
    'info@garden-design-school.com'
  )
ON CONFLICT (id) DO NOTHING;

-- 8. テスト用の顧客技術レベルデータを挿入
INSERT INTO customer_technical_levels (customer_id, lesson_school_id, total_points, current_level)
VALUES 
  (
    'eeb48bbb-88a1-4500-b334-4a01ac74faec', -- 既存の顧客ID
    '550e8400-e29b-41d4-a716-446655440001',
    150,
    'INTERMEDIATE'
  ),
  (
    'eeb48bbb-88a1-4500-b334-4a01ac74faec',
    '550e8400-e29b-41d4-a716-446655440002',
    80,
    'BEGINNER'
  )
ON CONFLICT (customer_id, lesson_school_id) DO NOTHING;

-- 9. テスト用のポイント履歴データを挿入
INSERT INTO customer_point_history (customer_id, lesson_school_id, points_change, reason, description)
VALUES 
  (
    'eeb48bbb-88a1-4500-b334-4a01ac74faec',
    '550e8400-e29b-41d4-a716-446655440001',
    50,
    'レッスン参加',
    '基礎フラワーアレンジメントレッスン'
  ),
  (
    'eeb48bbb-88a1-4500-b334-4a01ac74faec',
    '550e8400-e29b-41d4-a716-446655440001',
    30,
    '課題提出',
    '季節のアレンジメント課題'
  ),
  (
    'eeb48bbb-88a1-4500-b334-4a01ac74faec',
    '550e8400-e29b-41d4-a716-446655440001',
    70,
    'レッスン参加',
    '上級フラワーアレンジメントレッスン'
  ),
  (
    'eeb48bbb-88a1-4500-b334-4a01ac74faec',
    '550e8400-e29b-41d4-a716-446655440002',
    40,
    'レッスン参加',
    'ガーデンデザイン基礎レッスン'
  ),
  (
    'eeb48bbb-88a1-4500-b334-4a01ac74faec',
    '550e8400-e29b-41d4-a716-446655440002',
    40,
    'レッスン参加',
    '庭園デザイン実践レッスン'
  );

-- 10. データ確認
SELECT 
  c.name as customer_name,
  ls.name as school_name,
  ctl.total_points,
  ctl.current_level
FROM customer_technical_levels ctl
JOIN customers c ON ctl.customer_id = c.id
JOIN lesson_schools ls ON ctl.lesson_school_id = ls.id
WHERE c.user_id = 'a10425fb-db28-4db1-b731-0a5368aa7c06';
