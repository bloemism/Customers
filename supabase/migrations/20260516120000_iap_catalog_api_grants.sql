-- PostgREST（anon / authenticated）からの CRUD を明示的に許可（RLS と併用）
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.iap_catalog_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.iap_catalog_stock TO anon, authenticated;
