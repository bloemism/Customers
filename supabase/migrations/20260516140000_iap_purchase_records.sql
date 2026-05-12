-- アプリ内販売の購入記録（決済前の「記録」用。税込合計・届け先スナップショット・明細は JSON で保持）
-- 本番では RLS / 匿名書き込みを厳格化してください。

CREATE TABLE IF NOT EXISTS public.iap_purchase_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  buyer_kind text NOT NULL CHECK (buyer_kind IN ('customer', 'store', 'admin_dev')),
  viewer_role text NOT NULL DEFAULT 'customer',
  customer_id uuid,
  store_id text,
  delivery_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  lines_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal_yen_ex_tax bigint NOT NULL DEFAULT 0,
  tax_yen bigint NOT NULL DEFAULT 0,
  total_yen_inc_tax bigint NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.iap_purchase_records IS 'アプリ内販売の購入記録（単価は保持せず、税込合計と行ごとの記号・品目・ケース数など）';
COMMENT ON COLUMN public.iap_purchase_records.customer_id IS '顧客ログイン時の customers.id（auth.uid と一致する行）';
COMMENT ON COLUMN public.iap_purchase_records.store_id IS '店舗ログイン時の stores.id（text/uuid 混在に合わせ text）';
COMMENT ON COLUMN public.iap_purchase_records.delivery_snapshot IS '届け先・店舗情報のスナップショット JSON';
COMMENT ON COLUMN public.iap_purchase_records.lines_snapshot IS '[{symbol, item_name, variety_name, cases}, ...]';

CREATE INDEX IF NOT EXISTS idx_iap_purchase_records_created_at ON public.iap_purchase_records (created_at DESC);

ALTER TABLE public.iap_purchase_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS iap_purchase_records_dev_all ON public.iap_purchase_records;
CREATE POLICY iap_purchase_records_dev_all
  ON public.iap_purchase_records
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.iap_purchase_records TO anon, authenticated;
