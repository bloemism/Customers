-- 店舗の位置情報をデバッグ用に確認

-- 1. storesテーブルの全カラムを確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;

-- 2. 現在の店舗データと位置情報を確認
SELECT 
  id,
  store_name,
  address,
  latitude,
  longitude,
  owner_name,
  business_type,
  has_parking,
  is_verified,
  is_active,
  created_at
FROM stores 
ORDER BY created_at DESC;

-- 3. 位置情報がnullまたは0の店舗を確認
SELECT 
  id,
  store_name,
  address,
  latitude,
  longitude
FROM stores 
WHERE latitude IS NULL 
   OR longitude IS NULL 
   OR latitude = 0 
   OR longitude = 0
   OR latitude = 35.6762  -- デフォルト値
   OR longitude = 139.6503; -- デフォルト値
