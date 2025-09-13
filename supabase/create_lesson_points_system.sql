-- レッスンポイントシステム用テーブル作成

-- 1. 顧客のレッスンポイント履歴テーブル
CREATE TABLE IF NOT EXISTS customer_lesson_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  schedule_id UUID NOT NULL,
  lesson_title TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 10,
  earned_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 顧客のポイント合計テーブル（集計用）
CREATE TABLE IF NOT EXISTS customer_point_totals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL UNIQUE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. レッスン終了記録テーブル
CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL,
  lesson_title TEXT NOT NULL,
  completed_by TEXT NOT NULL, -- 店舗のメールアドレス
  completed_at TIMESTAMP DEFAULT NOW(),
  points_distributed BOOLEAN DEFAULT FALSE,
  total_participants INTEGER DEFAULT 0,
  points_given INTEGER DEFAULT 0
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_customer_lesson_points_customer_id ON customer_lesson_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_lesson_points_schedule_id ON customer_lesson_points(schedule_id);
CREATE INDEX IF NOT EXISTS idx_customer_lesson_points_earned_date ON customer_lesson_points(earned_date);
CREATE INDEX IF NOT EXISTS idx_customer_point_totals_customer_id ON customer_point_totals(customer_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_schedule_id ON lesson_completions(schedule_id);

-- RLS（Row Level Security）設定
ALTER TABLE customer_lesson_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- ポリシー設定（店舗側は自分のレッスンのポイントを管理可能）
CREATE POLICY "店舗は自分のレッスンのポイントを管理可能" ON customer_lesson_points
  FOR ALL USING (
    schedule_id IN (
      SELECT id FROM new_lesson_schedules 
      WHERE store_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "店舗はレッスン完了記録を管理可能" ON lesson_completions
  FOR ALL USING (
    completed_by = auth.jwt() ->> 'email'
  );

-- 顧客ポイント合計は読み取り専用（店舗側から）
CREATE POLICY "店舗は顧客ポイント合計を読み取り可能" ON customer_point_totals
  FOR SELECT USING (true);

-- レベル計算用の関数
CREATE OR REPLACE FUNCTION calculate_customer_level(total_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- レベル計算ロジック（100ポイントごとに1レベルアップ）
  RETURN GREATEST(1, (total_points / 100) + 1);
END;
$$ LANGUAGE plpgsql;

-- ポイント配布用の関数
CREATE OR REPLACE FUNCTION distribute_lesson_points(
  p_schedule_id UUID,
  p_completed_by TEXT
)
RETURNS JSON AS $$
DECLARE
  v_lesson_title TEXT;
  v_participants RECORD;
  v_total_points INTEGER := 0;
  v_completion_id UUID;
BEGIN
  -- レッスン情報を取得
  SELECT title INTO v_lesson_title
  FROM new_lesson_schedules
  WHERE id = p_schedule_id AND store_email = p_completed_by;
  
  IF v_lesson_title IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'レッスンが見つかりません');
  END IF;
  
  -- 参加中の顧客を取得
  FOR v_participants IN
    SELECT DISTINCT cp.customer_id, cp.customer_email, cp.customer_name
    FROM customer_participations cp
    WHERE cp.schedule_id = p_schedule_id AND cp.status = 'confirmed'
  LOOP
    -- ポイント履歴に追加
    INSERT INTO customer_lesson_points (
      customer_id, customer_email, customer_name, schedule_id, 
      lesson_title, points_earned
    ) VALUES (
      v_participants.customer_id, v_participants.customer_email, 
      v_participants.customer_name, p_schedule_id, v_lesson_title, 10
    );
    
    -- 顧客の合計ポイントを更新
    INSERT INTO customer_point_totals (customer_id, customer_email, customer_name, total_points)
    VALUES (v_participants.customer_id, v_participants.customer_email, v_participants.customer_name, 10)
    ON CONFLICT (customer_id) 
    DO UPDATE SET 
      total_points = customer_point_totals.total_points + 10,
      current_level = calculate_customer_level(customer_point_totals.total_points + 10),
      last_updated = NOW(),
      updated_at = NOW();
    
    v_total_points := v_total_points + 10;
  END LOOP;
  
  -- レッスン完了記録を作成
  INSERT INTO lesson_completions (
    schedule_id, lesson_title, completed_by, 
    total_participants, points_given, points_distributed
  ) VALUES (
    p_schedule_id, v_lesson_title, p_completed_by,
    (SELECT COUNT(*) FROM customer_participations WHERE schedule_id = p_schedule_id AND status = 'confirmed'),
    v_total_points, true
  ) RETURNING id INTO v_completion_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'ポイント配布完了',
    'total_participants', (SELECT COUNT(*) FROM customer_participations WHERE schedule_id = p_schedule_id AND status = 'confirmed'),
    'total_points', v_total_points,
    'completion_id', v_completion_id
  );
END;
$$ LANGUAGE plpgsql;

-- サンプルデータ（テスト用）
-- 既存のcustomersテーブルのデータを使用
-- botanism2011@gmail.com (中三川聖次) のデータが存在します
