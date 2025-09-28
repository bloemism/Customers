-- lesson_schoolsテーブルの修正

-- 1. 既存のlesson_schoolsテーブルを削除（存在する場合）
DROP TABLE IF EXISTS lesson_schools CASCADE;

-- 2. lesson_schoolsテーブルを正しく作成
CREATE TABLE lesson_schools (
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

-- 3. RLSを無効化（テスト用）
ALTER TABLE lesson_schools DISABLE ROW LEVEL SECURITY;

-- 4. テスト用のレッスンスクールデータを挿入
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
  );

-- 5. テーブル構造の確認
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'lesson_schools'
ORDER BY ordinal_position;

-- 6. データ確認
SELECT * FROM lesson_schools;
