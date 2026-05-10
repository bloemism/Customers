-- store-images バケットへの INSERT が「new row violates row-level security policy」で失敗する場合の修正。
-- リモートの SQL Editor で実行するか、マイグレーションとして適用してください。
-- auth.role() より PostgreSQL ロール authenticated を明示した方が JWT と整合しやすいです。

DROP POLICY IF EXISTS "Anyone can view store images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload store images" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update their store images" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete their store images" ON storage.objects;

CREATE POLICY "Anyone can view store images" ON storage.objects
FOR SELECT USING (bucket_id = 'store-images');

CREATE POLICY "Authenticated users can upload store images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'store-images');

CREATE POLICY "Store owners can update their store images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'store-images')
WITH CHECK (bucket_id = 'store-images');

CREATE POLICY "Store owners can delete their store images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'store-images');
