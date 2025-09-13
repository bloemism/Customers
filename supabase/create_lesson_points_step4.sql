-- ステップ4: RLS設定とポリシー

-- RLS設定
ALTER TABLE customer_lesson_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "店舗は自分のレッスンのポイントを管理可能" ON customer_lesson_points;
DROP POLICY IF EXISTS "店舗はレッスン完了記録を管理可能" ON lesson_completions;
DROP POLICY IF EXISTS "店舗は顧客ポイント合計を読み取り可能" ON customer_point_totals;

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
