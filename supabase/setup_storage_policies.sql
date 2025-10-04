-- Supabase StorageのRLSポリシー設定

-- 1. customer-uploadsバケットのRLSを有効化
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 2. 顧客が自分のプロフィール画像をアップロードできるポリシー
CREATE POLICY "Customers can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'customer-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. 顧客が自分のプロフィール画像を更新できるポリシー
CREATE POLICY "Customers can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'customer-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. 顧客が自分のプロフィール画像を削除できるポリシー
CREATE POLICY "Customers can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'customer-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. 全ユーザーがプロフィール画像を参照できるポリシー（公開画像のため）
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'customer-uploads');

-- 6. 既存のポリシーを削除（重複を避けるため）
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON storage.objects;


