-- customersテーブルにプロフィール画像URLカラムを追加

-- 1. profile_image_urlカラムを追加
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 2. カラムの説明を追加
COMMENT ON COLUMN customers.profile_image_url IS '顧客のプロフィール画像URL';

-- 3. 既存のデータを確認
SELECT id, name, email, profile_image_url FROM customers LIMIT 5;


