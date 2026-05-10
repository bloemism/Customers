-- 5174 店舗: 当店で決済したことがある顧客の customers 行を SELECT できるようにする
-- （ダッシュボードで実行）

DROP POLICY IF EXISTS "store_reads_customers_who_paid_store" ON public.customers;

CREATE POLICY "store_reads_customers_who_paid_store"
  ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.payment_transactions pt
      INNER JOIN public.stores s ON (
        s.email = (auth.jwt() ->> 'email')
        AND trim(both FROM pt.store_id) = s.id::text
      )
      WHERE pt.customer_id = customers.id
    )
  );

COMMENT ON POLICY "store_reads_customers_who_paid_store" ON public.customers IS
  '店舗ログイン（JWT email = stores.email）が、当店 payment_transactions に紐づく顧客を参照する';
