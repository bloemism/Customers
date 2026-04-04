-- 参加ボタンで+10pt・取り消しで-10pt。レッスン日過ぎたら取り消し不可（フロントで制御）なのでポイント固定。

-- 参加時にレッスンポイントを付与（顧客が「参加する」押下時）
CREATE OR REPLACE FUNCTION add_lesson_points_on_participation(
  p_schedule_id UUID,
  p_customer_id TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lesson_title TEXT;
  v_lesson_date DATE;
  v_existing_id UUID;
BEGIN
  SELECT title, date INTO v_lesson_title, v_lesson_date
  FROM new_lesson_schedules
  WHERE id = p_schedule_id;

  IF v_lesson_title IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'スケジュールが見つかりません');
  END IF;

  IF v_lesson_date < CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'message', 'レッスン期日後のためポイントは付与しません');
  END IF;

  -- 同一スケジュールで既にポイント付与済みなら重複付与しない
  SELECT id INTO v_existing_id
  FROM customer_lesson_points
  WHERE schedule_id = p_schedule_id AND customer_id = p_customer_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN json_build_object('success', true, 'message', '既にポイント付与済み');
  END IF;

  INSERT INTO customer_lesson_points (
    customer_id, customer_email, customer_name, schedule_id,
    lesson_title, points_earned
  ) VALUES (
    p_customer_id, p_customer_email, p_customer_name, p_schedule_id,
    v_lesson_title, 10
  );

  INSERT INTO customer_point_totals (customer_id, customer_email, customer_name, total_points, current_level)
  VALUES (p_customer_id, p_customer_email, p_customer_name, 10, 1)
  ON CONFLICT (customer_id)
  DO UPDATE SET
    total_points = customer_point_totals.total_points + 10,
    current_level = calculate_customer_level(customer_point_totals.total_points + 10),
    last_updated = NOW(),
    updated_at = NOW();

  RETURN json_build_object('success', true, 'points_added', 10);
END;
$$;

-- 取り消し時にレッスンポイントを減算（顧客が「取り消し」押下時・レッスン日前のみ）
CREATE OR REPLACE FUNCTION remove_lesson_points_on_cancel(
  p_schedule_id UUID,
  p_customer_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_id UUID;
  v_lesson_date DATE;
BEGIN
  SELECT date INTO v_lesson_date
  FROM new_lesson_schedules
  WHERE id = p_schedule_id;

  IF v_lesson_date IS NOT NULL AND v_lesson_date < CURRENT_DATE THEN
    RETURN json_build_object('success', true, 'message', 'レッスン期日後のためポイントは変更しません');
  END IF;

  DELETE FROM customer_lesson_points
  WHERE schedule_id = p_schedule_id AND customer_id = p_customer_id
  RETURNING id INTO v_deleted_id;

  IF v_deleted_id IS NULL THEN
    RETURN json_build_object('success', true, 'message', '付与履歴なし');
  END IF;

  UPDATE customer_point_totals
  SET
    total_points = GREATEST(0, total_points - 10),
    current_level = calculate_customer_level(GREATEST(0, total_points - 10)),
    last_updated = NOW(),
    updated_at = NOW()
  WHERE customer_id = p_customer_id;

  RETURN json_build_object('success', true, 'points_removed', 10);
END;
$$;
