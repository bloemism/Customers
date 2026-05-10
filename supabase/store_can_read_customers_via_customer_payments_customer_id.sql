-- 店舗: customer_payments.customer_id（= customers.id）が一致する顧客行を参照できるようにする
-- （payment_transactions.customer_id が空／別 UUID のときでも CP 側に正しい顧客が載っている場合の補助）

DROP POLICY IF EXISTS "store_reads_customers_via_cp_customer_id" ON public.customers;

CREATE POLICY "store_reads_customers_via_cp_customer_id"
  ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.customer_payments cp
      INNER JOIN public.stores s ON (
        s.email = (auth.jwt() ->> 'email')
        AND trim(both FROM cp.store_id) = s.id::text
      )
      WHERE cp.customer_id IS NOT NULL
        AND trim(both FROM cp.customer_id::text) = customers.id::text
    )
  );

COMMENT ON POLICY "store_reads_customers_via_cp_customer_id" ON public.customers IS
  '当店の customer_payments.customer_id（customers.id）と一致する顧客を参照する';
