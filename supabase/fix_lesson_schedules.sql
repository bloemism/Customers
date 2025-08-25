-- lesson_schedulesテーブルの修正

-- updated_atカラムを追加
ALTER TABLE lesson_schedules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 更新日時の自動更新用トリガー関数（既存の場合は更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- lesson_schedulesテーブルのトリガーを作成
DROP TRIGGER IF EXISTS update_lesson_schedules_updated_at ON lesson_schedules;
CREATE TRIGGER update_lesson_schedules_updated_at 
  BEFORE UPDATE ON lesson_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 既存のレコードのupdated_atを現在時刻で更新
UPDATE lesson_schedules SET updated_at = NOW() WHERE updated_at IS NULL;

