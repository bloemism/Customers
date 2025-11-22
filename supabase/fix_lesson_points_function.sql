-- 修正されたポイント配布関数

-- 既存の関数を削除
DROP FUNCTION IF EXISTS distribute_lesson_points(UUID, TEXT);

-- 修正されたポイント配布用の関数
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
  -- レッスン情報を取得（new_lesson_schedulesテーブルから）
  SELECT title INTO v_lesson_title
  FROM new_lesson_schedules
  WHERE id = p_schedule_id AND store_email = p_completed_by;
  
  IF v_lesson_title IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'レッスンが見つかりません');
  END IF;
  
  -- 参加中の顧客を取得（customer_participationsテーブルから）
  FOR v_participants IN
    SELECT DISTINCT 
      COALESCE(cp.customer_id, 'unknown_' || cp.customer_email) as customer_id,
      cp.customer_email, 
      cp.customer_name
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
    
    -- customersテーブルも更新（顧客アプリ連携用）
    UPDATE customers 
    SET 
      total_points_earned = COALESCE(total_points_earned, 0) + 10,
      total_points = COALESCE(total_points, 0) + 10,
      updated_at = NOW()
    WHERE email = v_participants.customer_email;
    
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
