-- customer_notifications にレッスン参加・取り消し連携用のカラムを追加
-- 参加・取り消し時に 1 件ずつ INSERT し、タイトル・メッセージ・スケジュールIDを保存する

ALTER TABLE customer_notifications
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS related_schedule_id UUID;

COMMENT ON COLUMN customer_notifications.notification_type IS '例: lesson_participation, lesson_cancellation';
COMMENT ON COLUMN customer_notifications.related_schedule_id IS 'new_lesson_schedules.id';
