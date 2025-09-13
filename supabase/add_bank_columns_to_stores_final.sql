-- storesテーブルに銀行口座情報のカラムを追加

-- 1. 既存のstoresテーブルの構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;

-- 2. 銀行口座情報のカラムを追加（存在しない場合のみ）
DO $$ 
BEGIN
    -- bank_nameカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'bank_name'
    ) THEN
        ALTER TABLE stores ADD COLUMN bank_name TEXT;
    END IF;

    -- branch_nameカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'branch_name'
    ) THEN
        ALTER TABLE stores ADD COLUMN branch_name TEXT;
    END IF;

    -- account_typeカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'account_type'
    ) THEN
        ALTER TABLE stores ADD COLUMN account_type TEXT DEFAULT '普通';
    END IF;

    -- account_numberカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'account_number'
    ) THEN
        ALTER TABLE stores ADD COLUMN account_number TEXT;
    END IF;

    -- account_holderカラムを追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'account_holder'
    ) THEN
        ALTER TABLE stores ADD COLUMN account_holder TEXT;
    END IF;

    -- online_shopカラムを追加（フォームにあるがテーブルにない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'online_shop'
    ) THEN
        ALTER TABLE stores ADD COLUMN online_shop TEXT;
    END IF;

    -- parkingカラムを追加（フォームにあるがテーブルにない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'parking'
    ) THEN
        ALTER TABLE stores ADD COLUMN parking BOOLEAN DEFAULT FALSE;
    END IF;

    -- instagramカラムを追加（フォームにあるがテーブルにない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'instagram'
    ) THEN
        ALTER TABLE stores ADD COLUMN instagram TEXT;
    END IF;

    -- business_hoursカラムを追加（フォームにあるがテーブルにない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'business_hours'
    ) THEN
        ALTER TABLE stores ADD COLUMN business_hours TEXT;
    END IF;

    -- descriptionカラムを追加（フォームにあるがテーブルにない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE stores ADD COLUMN description TEXT;
    END IF;

    -- is_activeカラムを追加（フォームにあるがテーブルにない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE stores ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- created_atカラムを追加（フォームにあるがテーブルにない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE stores ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- updated_atカラムを追加（フォームにあるがテーブルにない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE stores ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. インデックスを追加（必要に応じて）
CREATE INDEX IF NOT EXISTS idx_stores_bank_name ON stores(bank_name);
CREATE INDEX IF NOT EXISTS idx_stores_account_number ON stores(account_number);
CREATE INDEX IF NOT EXISTS idx_stores_email ON stores(email);

-- 4. 更新後のテーブル構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;
