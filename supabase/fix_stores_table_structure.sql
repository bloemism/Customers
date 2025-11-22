-- storesテーブルの構造を修正

-- 1. 既存のstoresテーブルの構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;

-- 2. storesテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_name TEXT NOT NULL,
    name TEXT, -- 互換性のため
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    online_shop TEXT,
    business_hours TEXT,
    description TEXT,
    parking BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 既存のテーブルにidカラムがない場合は追加
DO $$ 
BEGIN
    -- idカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE stores ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
    END IF;

    -- store_nameカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'store_name'
    ) THEN
        ALTER TABLE stores ADD COLUMN store_name TEXT;
    END IF;

    -- nameカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE stores ADD COLUMN name TEXT;
    END IF;

    -- addressカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE stores ADD COLUMN address TEXT;
    END IF;

    -- phoneカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE stores ADD COLUMN phone TEXT;
    END IF;

    -- emailカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE stores ADD COLUMN email TEXT;
    END IF;

    -- websiteカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'website'
    ) THEN
        ALTER TABLE stores ADD COLUMN website TEXT;
    END IF;

    -- instagramカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'instagram'
    ) THEN
        ALTER TABLE stores ADD COLUMN instagram TEXT;
    END IF;

    -- online_shopカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'online_shop'
    ) THEN
        ALTER TABLE stores ADD COLUMN online_shop TEXT;
    END IF;

    -- business_hoursカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'business_hours'
    ) THEN
        ALTER TABLE stores ADD COLUMN business_hours TEXT;
    END IF;

    -- descriptionカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE stores ADD COLUMN description TEXT;
    END IF;

    -- parkingカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'parking'
    ) THEN
        ALTER TABLE stores ADD COLUMN parking BOOLEAN DEFAULT FALSE;
    END IF;

    -- is_activeカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE stores ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- created_atカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE stores ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- updated_atカラムを追加（存在しない場合のみ）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE stores ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_stores_email ON stores(email);
CREATE INDEX IF NOT EXISTS idx_stores_store_name ON stores(store_name);

-- 5. RLSポリシーを設定（存在しない場合のみ）
DO $$
BEGIN
    -- 店舗は自分のデータのみアクセス可能
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stores' 
        AND policyname = '店舗は自分のデータのみアクセス可能'
    ) THEN
        CREATE POLICY "店舗は自分のデータのみアクセス可能" ON stores
            FOR ALL USING (email = auth.jwt() ->> 'email');
    END IF;

    -- 認証されたユーザーは店舗データを読み取り可能
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stores' 
        AND policyname = '認証されたユーザーは店舗データを読み取り可能'
    ) THEN
        CREATE POLICY "認証されたユーザーは店舗データを読み取り可能" ON stores
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 6. テーブルにRLSを有効化
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;