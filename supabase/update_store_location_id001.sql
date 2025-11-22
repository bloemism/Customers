-- 店舗id-001の位置情報を正確な住所に更新

-- 1. 現在の店舗id-001の情報を確認
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
WHERE id = 'id-001';

-- 2. 東京都港区芝5-10-4の正確な座標に更新
-- この住所の座標: 緯度 35.6508, 経度 139.7486
UPDATE stores 
SET 
  address = '東京都港区芝5-10-4',
  latitude = 35.6508,
  longitude = 139.7486,
  owner_name = '中三川聖次',
  business_type = 'florist',
  has_parking = true,
  is_verified = true,
  updated_at = NOW()
WHERE id = 'id-001';

-- 3. 更新後の確認
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
  updated_at
FROM stores 
WHERE id = 'id-001';
