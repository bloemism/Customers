-- 顧客注文の届け先・状態を iap_purchase_records に足す。
-- 既存の購入記録定義は崩さない。未作成の環境でもこのファイル単独で足せるよう、
-- ベース表の CREATE は IF NOT EXISTS、追加列は ADD COLUMN IF NOT EXISTS。
-- 本番への適用は、Supabase 側のテーブル条件が来るまで行わない。

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

ALTER TABLE public.iap_purchase_records
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS prefecture text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS street_address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS assigned_store_id text,
  ADD COLUMN IF NOT EXISTS assigned_market_name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'received';

COMMENT ON COLUMN public.iap_purchase_records.customer_name IS '注文時の顧客氏名（customers.name の写し）';
COMMENT ON COLUMN public.iap_purchase_records.prefecture IS '地域: 都道府県（customers.address の写し）';
COMMENT ON COLUMN public.iap_purchase_records.city IS '地域: 市区町村（customers.address_2 の写し）';
COMMENT ON COLUMN public.iap_purchase_records.postal_code IS '顧客が注文時に入力した郵便番号';
COMMENT ON COLUMN public.iap_purchase_records.street_address IS '顧客が注文時に入力した番地・建物';
COMMENT ON COLUMN public.iap_purchase_records.phone IS '顧客が注文時に入力した電話番号';
COMMENT ON COLUMN public.iap_purchase_records.assigned_store_id IS '配達する店舗。顧客は設定しない。運営が後から入れる';
COMMENT ON COLUMN public.iap_purchase_records.assigned_market_name IS '花を受け取る市場名。運営が配達店舗の既定値をもとに決める';
COMMENT ON COLUMN public.iap_purchase_records.status IS '注文状態。顧客の記録直後は received';
COMMENT ON COLUMN public.iap_purchase_records.lines_snapshot IS '[{symbol, item_name, variety_name, cases, unit_price_yen, line_subtotal_yen}, ...] 単価はその時点のケース単価';

CREATE INDEX IF NOT EXISTS idx_iap_purchase_records_created_at ON public.iap_purchase_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iap_purchase_records_customer_id ON public.iap_purchase_records (customer_id);
CREATE INDEX IF NOT EXISTS idx_iap_purchase_records_status ON public.iap_purchase_records (status);
