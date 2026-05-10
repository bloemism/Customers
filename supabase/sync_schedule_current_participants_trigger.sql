-- customer_participations の変更で new_lesson_schedules.current_participants を確定人数と同期する

CREATE OR REPLACE FUNCTION public.sync_schedule_current_participants_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    sid := OLD.schedule_id;
  ELSE
    sid := NEW.schedule_id;
  END IF;

  UPDATE public.new_lesson_schedules nls
  SET
    current_participants = (
      SELECT COUNT(*)::INT
      FROM public.customer_participations cp
      WHERE cp.schedule_id = sid AND cp.status = 'confirmed'
    ),
    updated_at = NOW()
  WHERE nls.id = sid;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_participations_sync_count ON public.customer_participations;

CREATE TRIGGER trg_customer_participations_sync_count
  AFTER INSERT OR UPDATE OF schedule_id, status OR DELETE
  ON public.customer_participations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_schedule_current_participants_count();

-- 既存行を一度整合
UPDATE public.new_lesson_schedules nls
SET
  current_participants = COALESCE(sub.cnt, 0),
  updated_at = NOW()
FROM (
  SELECT schedule_id, COUNT(*)::INT AS cnt
  FROM public.customer_participations
  WHERE status = 'confirmed'
  GROUP BY schedule_id
) sub
WHERE nls.id = sub.schedule_id;

UPDATE public.new_lesson_schedules nls
SET current_participants = 0, updated_at = NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.customer_participations cp
  WHERE cp.schedule_id = nls.id AND cp.status = 'confirmed'
)
AND current_participants <> 0;

COMMENT ON FUNCTION public.sync_schedule_current_participants_count() IS
  '確定参加人数に応じて new_lesson_schedules.current_participants を更新';
