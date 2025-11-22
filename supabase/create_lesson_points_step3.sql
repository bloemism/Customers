-- ステップ3: レッスン完了記録テーブルを作成

CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL,
  lesson_title TEXT NOT NULL,
  completed_by TEXT NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  points_distributed BOOLEAN DEFAULT FALSE,
  total_participants INTEGER DEFAULT 0,
  points_given INTEGER DEFAULT 0
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_lesson_completions_schedule_id ON lesson_completions(schedule_id);
