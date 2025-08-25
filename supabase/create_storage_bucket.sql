-- Supabase Storageバケット作成

-- 店舗画像用のStorageバケットを作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-images',
  'store-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storageポリシーを設定
CREATE POLICY "Anyone can view store images" ON storage.objects
FOR SELECT USING (bucket_id = 'store-images');

CREATE POLICY "Authenticated users can upload store images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'store-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Store owners can update their store images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'store-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Store owners can delete their store images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'store-images' 
  AND auth.role() = 'authenticated'
);
