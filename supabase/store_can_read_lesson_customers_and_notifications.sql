-- 5174 店舗アプリ: 自スクールのレッスンに関する顧客情報・通知を読めるようにする
-- （Supabase ダッシュボードで実行）

-- 1) customers: 自分のスクールの schedule に参加レコードがある顧客のみ SELECT 可能
DROP POLICY IF EXISTS "store_reads_customers_via_own_lesson_participation" ON public.customers;
CREATE POLICY "store_reads_customers_via_own_lesson_participation"
  ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.customer_participations cp
      JOIN public.new_lesson_schedules nls ON nls.id = cp.schedule_id
      JOIN public.lesson_schools ls ON ls.id = nls.lesson_school_id
      WHERE cp.customer_id = customers.id
        AND ls.store_email = (auth.jwt() ->> 'email')
    )
  );

-- 2) customer_notifications: 自分のスクールのスケジュールに紐づく通知を SELECT（参加・取消ログ）
DROP POLICY IF EXISTS "store_reads_lesson_notifications" ON public.customer_notifications;
CREATE POLICY "store_reads_lesson_notifications"
  ON public.customer_notifications
  FOR SELECT
  USING (
    related_schedule_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.new_lesson_schedules nls
      JOIN public.lesson_schools ls ON ls.id = nls.lesson_school_id
      WHERE nls.id = customer_notifications.related_schedule_id
        AND ls.store_email = (auth.jwt() ->> 'email')
    )
  );

COMMENT ON POLICY "store_reads_customers_via_own_lesson_participation" ON public.customers IS
  '店舗ユーザー（JWT email = lesson_schools.store_email）が、自スクールのレッスン参加者のプロフィールを参照する';

COMMENT ON POLICY "store_reads_lesson_notifications" ON public.customer_notifications IS
  '店舗ユーザーが、自スクールのレッスンに関する customer_notifications（参加・取消）を参照する';
