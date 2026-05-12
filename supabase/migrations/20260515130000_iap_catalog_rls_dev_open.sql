-- アプリ内販売カタログ: RLS 有効化 + 開発検証用の緩いポリシー
-- 本番では anon の ALL を廃止し、authenticated + ロール条件に差し替えてください。

ALTER TABLE public.iap_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iap_catalog_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS iap_catalog_items_dev_all ON public.iap_catalog_items;
CREATE POLICY iap_catalog_items_dev_all
  ON public.iap_catalog_items
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS iap_catalog_stock_dev_all ON public.iap_catalog_stock;
CREATE POLICY iap_catalog_stock_dev_all
  ON public.iap_catalog_stock
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
