-- レッスンスクール管理用テーブル作成（完全版）

-- レッスンスケジュールテーブル
CREATE TABLE IF NOT EXISTS lesson_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_school_id UUID NOT NULL REFERENCES lesson_schools(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 生徒予約テーブル
CREATE TABLE IF NOT EXISTS student_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES lesson_schedules(id) ON DELETE CASCADE,
  student_name VARCHAR(100) NOT NULL,
  student_email VARCHAR(255),
  student_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  qr_code_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_lesson_schools_store_email ON lesson_schools(store_email);
CREATE INDEX IF NOT EXISTS idx_lesson_schools_prefecture ON lesson_schools(prefecture);
CREATE INDEX IF NOT EXISTS idx_lesson_schools_is_active ON lesson_schools(is_active);
CREATE INDEX IF NOT EXISTS idx_lesson_schedules_school_id ON lesson_schedules(lesson_school_id);
CREATE INDEX IF NOT EXISTS idx_lesson_schedules_date ON lesson_schedules(date);
CREATE INDEX IF NOT EXISTS idx_student_reservations_schedule_id ON student_reservations(schedule_id);

-- 更新日時の自動更新用トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 既存のテーブルにupdated_atカラムを追加（基本版にはなかったため）
ALTER TABLE region_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lesson_schools ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- トリガーの作成
CREATE TRIGGER update_region_categories_updated_at 
  BEFORE UPDATE ON region_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_schools_updated_at 
  BEFORE UPDATE ON lesson_schools 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_schedules_updated_at 
  BEFORE UPDATE ON lesson_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_reservations_updated_at 
  BEFORE UPDATE ON student_reservations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 権限設定
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

