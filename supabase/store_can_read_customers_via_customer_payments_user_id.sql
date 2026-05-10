-- 店舗: customer_payments.user_id が customers.user_id と一致する行を参照できるようにする
-- （payment_transactions の customer_id とずれるケースの補助）

DROP POLICY IF EXISTS "store_reads_customers_via_cp_user_id" ON public.customers;

CREATE POLICY "store_reads_customers_via_cp_user_id"
  ON public.customers
  FOR SELECT
  USING (
    customers.user_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.customer_payments cp
      INNER JOIN public.stores s ON (
        s.email = (auth.jwt() ->> 'email')
        AND trim(both FROM cp.store_id) = s.id::text
      )
      WHERE trim(both FROM cp.user_id::text) = customers.user_id::text
    )
  );

COMMENT ON POLICY "store_reads_customers_via_cp_user_id" ON public.customers IS
  '当店の customer_payments に登録された auth user_id と customers.user_id が一致する顧客を参照する';
