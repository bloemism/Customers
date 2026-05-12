-- アプリ内販売（B2B/B2C）用: stores / customers の識別カラム + カタログ・在庫テーブル
-- アプリ本体への組み込みは後から。スキーマのみ先行して用意する。
-- 冪等: 制約は存在時はスキップ。トリガーは DROP IF EXISTS 後に作成。

-- ---------------------------------------------------------------------------
-- stores: 卸（B2B）チャネル用メタ
-- ---------------------------------------------------------------------------
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS iap_b2b_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.stores.iap_b2b_enabled IS 'true: 卸向けアプリ内販売チャネルを利用する店舗';

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS iap_wholesaler_code text;

COMMENT ON COLUMN public.stores.iap_wholesaler_code IS '卸側の識別コード（手動採番・任意）';

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS iap_default_delivery_market_name text;

COMMENT ON COLUMN public.stores.iap_default_delivery_market_name IS '届け先市場名のデフォルト（任意）';

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS iap_catalog_access text NOT NULL DEFAULT 'b2b_buyer';

COMMENT ON COLUMN public.stores.iap_catalog_access IS 'b2b_buyer=通常卸（卸価格・B2B掲載想定） / b2b_suspended=卸チャネル一時停止';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stores_iap_catalog_access_check'
  ) THEN
    ALTER TABLE public.stores
      ADD CONSTRAINT stores_iap_catalog_access_check
      CHECK (iap_catalog_access IN ('b2b_buyer', 'b2b_suspended'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stores_iap_b2b_enabled ON public.stores (iap_b2b_enabled) WHERE iap_b2b_enabled = true;
CREATE INDEX IF NOT EXISTS idx_stores_iap_catalog_access ON public.stores (iap_catalog_access);

-- ---------------------------------------------------------------------------
-- customers: 小売（B2C）チャネル + カタログ管理者
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS iap_b2c_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.customers.iap_b2c_enabled IS 'true: 小売向けアプリ内販売（B2C）を利用する顧客';

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS iap_retail_buyer_code text;

COMMENT ON COLUMN public.customers.iap_retail_buyer_code IS '小売側の顧客コード（手動採番・任意）';

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS iap_catalog_access text NOT NULL DEFAULT 'b2c_buyer';

COMMENT ON COLUMN public.customers.iap_catalog_access IS 'b2c_buyer=一般顧客 / iap_catalog_admin=運用手動設定のアプリ内販売カタログ管理者';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_iap_catalog_access_check'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_iap_catalog_access_check
      CHECK (iap_catalog_access IN ('b2c_buyer', 'iap_catalog_admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_iap_catalog_access ON public.customers (iap_catalog_access);

-- ---------------------------------------------------------------------------
-- カタログ品目（品目・価格・ケース本数・公開フラグ）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.iap_catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL DEFAULT '',
  item_name text NOT NULL DEFAULT '',
  variety_name text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  origin text NOT NULL DEFAULT '',
  size_label text NOT NULL DEFAULT '',
  grade_class text NOT NULL DEFAULT 'standard' CHECK (grade_class IN ('standard', 'non_standard')),
  image_url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  wholesale_price_yen integer NOT NULL DEFAULT 0,
  b2b_units_per_case integer NOT NULL DEFAULT 0,
  b2b_case_count integer NOT NULL DEFAULT 0,
  retail_price_yen integer NOT NULL DEFAULT 0,
  b2c_units_per_case integer NOT NULL DEFAULT 0,
  b2c_case_count integer NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0.1,
  is_published boolean NOT NULL DEFAULT false,
  is_public_b2b boolean NOT NULL DEFAULT false,
  is_public_b2c boolean NOT NULL DEFAULT false,
  sales_starts_at timestamptz NOT NULL DEFAULT now(),
  sales_ends_at timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  seller_store_id uuid REFERENCES public.stores (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.iap_catalog_items IS 'アプリ内販売カタログ（ロールにより B2B/B2C 表示を切替）';
COMMENT ON COLUMN public.iap_catalog_items.seller_store_id IS '掲載オーナー店舗（任意）';

CREATE INDEX IF NOT EXISTS idx_iap_catalog_items_public_b2b
  ON public.iap_catalog_items (is_published, is_public_b2b) WHERE is_public_b2b = true;
CREATE INDEX IF NOT EXISTS idx_iap_catalog_items_public_b2c
  ON public.iap_catalog_items (is_published, is_public_b2c) WHERE is_public_b2c = true;
CREATE INDEX IF NOT EXISTS idx_iap_catalog_items_sales_window ON public.iap_catalog_items (sales_starts_at, sales_ends_at);

-- ---------------------------------------------------------------------------
-- 在庫（カタログ行と 1:1）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.iap_catalog_stock (
  catalog_item_id uuid PRIMARY KEY REFERENCES public.iap_catalog_items (id) ON DELETE CASCADE,
  quantity_available integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.iap_catalog_stock IS 'iap_catalog_items の在庫数';

CREATE OR REPLACE FUNCTION public.set_iap_row_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_iap_catalog_items_updated_at ON public.iap_catalog_items;
CREATE TRIGGER trg_iap_catalog_items_updated_at
  BEFORE UPDATE ON public.iap_catalog_items
  FOR EACH ROW EXECUTE PROCEDURE public.set_iap_row_updated_at();

DROP TRIGGER IF EXISTS trg_iap_catalog_stock_updated_at ON public.iap_catalog_stock;
CREATE TRIGGER trg_iap_catalog_stock_updated_at
  BEFORE UPDATE ON public.iap_catalog_stock
  FOR EACH ROW EXECUTE PROCEDURE public.set_iap_row_updated_at();

-- RLS・権限は本番前に別マイグレーションで追加してください。
