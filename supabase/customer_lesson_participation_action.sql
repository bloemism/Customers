-- 顧客アプリ: レッスン「参加」「取り消し」を1トランザクションで処理
-- customer_participations / customer_notifications / customer_lesson_points / customer_point_totals
-- レッスン日が CURRENT_DATE より前の場合は取り消し不可・ポイント減算不可（期日後はポイント固定）
--
-- 87app 本番スキーマ: customer_notifications は user_id（auth.uid）ベース。
-- title / message / related_schedule_id が無い場合は先に ALTER を実行すること。

ALTER TABLE public.customer_notifications
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS related_schedule_id UUID;

CREATE OR REPLACE FUNCTION public.customer_lesson_participation_action(
  p_schedule_id UUID,
  p_action TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_customer_id UUID;
  v_email TEXT;
  v_name TEXT;
  v_phone TEXT;
  v_lesson_title TEXT;
  v_lesson_date DATE;
  v_max INTEGER;
  v_confirmed INTEGER;
  v_existing_id UUID;
  v_points_id UUID;
  v_points_row_customer_id TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'ログインが必要です');
  END IF;

  IF p_action NOT IN ('join', 'cancel') THEN
    RETURN json_build_object('success', false, 'error', '不正な操作です');
  END IF;

  SELECT c.id, c.email, c.name, c.phone
  INTO v_customer_id, v_email, v_name, v_phone
  FROM customers c
  WHERE c.id = v_uid OR c.user_id = v_uid
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '顧客プロフィールが見つかりません');
  END IF;

  SELECT nls.title, nls.date, nls.max_participants
  INTO v_lesson_title, v_lesson_date, v_max
  FROM new_lesson_schedules nls
  WHERE nls.id = p_schedule_id;

  IF v_lesson_title IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'スケジュールが見つかりません');
  END IF;

  v_max := COALESCE(v_max, 1);

  IF p_action = 'join' THEN
    IF v_lesson_date < CURRENT_DATE THEN
      RETURN json_build_object('success', false, 'error', '開催日を過ぎたレッスンには参加登録できません');
    END IF;

    SELECT id INTO v_existing_id
    FROM customer_participations
    WHERE schedule_id = p_schedule_id AND status = 'confirmed'
      AND (customer_id = v_customer_id OR customer_id = v_uid)
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN json_build_object('success', false, 'error', '既にこのレッスンに参加登録済みです');
    END IF;

    SELECT COUNT(*)::INT INTO v_confirmed
    FROM customer_participations
    WHERE schedule_id = p_schedule_id AND status = 'confirmed';

    IF v_confirmed >= v_max THEN
      RETURN json_build_object('success', false, 'error', '定員に達しています');
    END IF;

    INSERT INTO customer_participations (
      schedule_id, customer_id, customer_name, customer_email, customer_phone, status
    ) VALUES (
      p_schedule_id, v_customer_id, v_name, v_email, v_phone, 'confirmed'
    );

    INSERT INTO customer_notifications (
      user_id, notification_type, is_enabled, title, message, related_schedule_id
    ) VALUES (
      v_uid, 'lesson_participation', true,
      'レッスン参加申し込み',
      '「' || v_lesson_title || '」に参加を申し込みました。',
      p_schedule_id
    );

    SELECT id INTO v_points_id
    FROM customer_lesson_points
    WHERE schedule_id = p_schedule_id
      AND (customer_id = v_customer_id::TEXT OR customer_id = v_uid::TEXT)
    LIMIT 1;

    IF v_points_id IS NULL THEN
      INSERT INTO customer_lesson_points (
        customer_id, customer_email, customer_name, schedule_id, lesson_title, points_earned
      ) VALUES (
        v_customer_id::TEXT, v_email, v_name, p_schedule_id, v_lesson_title, 10
      );

      INSERT INTO customer_point_totals (customer_id, customer_email, customer_name, total_points, current_level)
      VALUES (v_customer_id::TEXT, v_email, v_name, 10, 1)
      ON CONFLICT (customer_id)
      DO UPDATE SET
        total_points = customer_point_totals.total_points + 10,
        current_level = calculate_customer_level(customer_point_totals.total_points + 10),
        last_updated = NOW(),
        updated_at = NOW();
    END IF;

    RETURN json_build_object('success', true, 'action', 'join');
  END IF;

  IF v_lesson_date < CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'error', 'レッスン日を過ぎているため取り消しできません');
  END IF;

  SELECT id INTO v_existing_id
  FROM customer_participations
  WHERE schedule_id = p_schedule_id AND status = 'confirmed'
    AND (customer_id = v_customer_id OR customer_id = v_uid)
  LIMIT 1;

  IF v_existing_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '参加記録が見つかりません');
  END IF;

  UPDATE customer_participations
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = v_existing_id;

  INSERT INTO customer_notifications (
    user_id, notification_type, is_enabled, title, message, related_schedule_id
  ) VALUES (
    v_uid, 'lesson_cancellation', true,
    'レッスン参加取り消し',
    '「' || v_lesson_title || '」の参加を取り消しました。',
    p_schedule_id
  );

  v_points_row_customer_id := NULL;
  DELETE FROM customer_lesson_points
  WHERE schedule_id = p_schedule_id
    AND (customer_id = v_customer_id::TEXT OR customer_id = v_uid::TEXT)
  RETURNING customer_id INTO v_points_row_customer_id;

  IF v_points_row_customer_id IS NOT NULL THEN
    UPDATE customer_point_totals
    SET
      total_points = GREATEST(0, total_points - 10),
      current_level = calculate_customer_level(GREATEST(0, total_points - 10)),
      last_updated = NOW(),
      updated_at = NOW()
    WHERE customer_id = v_points_row_customer_id;
  END IF;

  RETURN json_build_object('success', true, 'action', 'cancel');
END;
$$;

REVOKE ALL ON FUNCTION public.customer_lesson_participation_action(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_lesson_participation_action(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.customer_lesson_participation_action IS
  '顧客: レッスン参加/取り消しを participations・notifications・lesson_points を一括更新。期日後は cancel 不可・ポイント固定。';
