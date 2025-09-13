-- storesテーブルに位置情報カラムを追加

-- 1. 既存のstoresテーブルの構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;

-- 2. 位置情報カラムを追加（存在しない場合のみ）
DO $$ 
BEGIN
    -- latitudeカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE stores ADD COLUMN latitude DECIMAL(10, 8);
    END IF;

    -- longitudeカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE stores ADD COLUMN longitude DECIMAL(11, 8);
    END IF;

    -- owner_nameカラムを追加（マップで使用）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'owner_name'
    ) THEN
        ALTER TABLE stores ADD COLUMN owner_name TEXT;
    END IF;

    -- business_typeカラムを追加（マップで使用）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'business_type'
    ) THEN
        ALTER TABLE stores ADD COLUMN business_type TEXT DEFAULT 'florist';
    END IF;

    -- has_parkingカラムを追加（マップで使用）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'has_parking'
    ) THEN
        ALTER TABLE stores ADD COLUMN has_parking BOOLEAN DEFAULT FALSE;
    END IF;

    -- is_verifiedカラムを追加（マップで使用）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE stores ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. 既存のテストデータに位置情報を追加
UPDATE stores 
SET 
    latitude = 35.6762,  -- 東京の緯度
    longitude = 139.6503, -- 東京の経度
    owner_name = '中三川聖次',
    business_type = 'florist',
    has_parking = true,
    is_verified = true
WHERE id = 'id-001';

-- 4. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_stores_latitude ON stores(latitude);
CREATE INDEX IF NOT EXISTS idx_stores_longitude ON stores(longitude);
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(latitude, longitude);

-- 5. 更新後のテーブル構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;
