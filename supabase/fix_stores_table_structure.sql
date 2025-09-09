-- storesテーブルの構造を修正
-- 87app Flower Shop Management System

-- 1. 現在のstoresテーブルの構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'stores'
ORDER BY ordinal_position;

-- 2. owner_idカラムが存在しない場合、追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stores' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.stores ADD COLUMN owner_id UUID;
        RAISE NOTICE 'owner_idカラムを追加しました';
    END IF;
END
$$;

-- 3. 既存のデータがある場合、owner_idを設定
-- 注意：これは既存のデータがある場合のみ実行
UPDATE public.stores 
SET owner_id = (
    SELECT id FROM auth.users 
    WHERE email = stores.email 
    LIMIT 1
)
WHERE owner_id IS NULL AND email IS NOT NULL;

-- 4. owner_idをNOT NULLに設定（データが設定された後）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.stores 
        WHERE owner_id IS NOT NULL
    ) THEN
        ALTER TABLE public.stores ALTER COLUMN owner_id SET NOT NULL;
        RAISE NOTICE 'owner_idをNOT NULLに設定しました';
    END IF;
END
$$;

-- 5. 外部キー制約を追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'stores' 
        AND constraint_name = 'stores_owner_id_fkey'
    ) THEN
        ALTER TABLE public.stores 
        ADD CONSTRAINT stores_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '外部キー制約を追加しました';
    END IF;
END
$$;

-- 6. 銀行口座情報のカラムを追加（まだ存在しない場合）
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS branch_name TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT '普通',
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

-- 7. その他の不足しているカラムを追加
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS online_shop TEXT,
ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) DEFAULT 35.6762,
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) DEFAULT 139.6503;

-- 8. store_nameが空の場合、nameからコピー
UPDATE public.stores 
SET store_name = name 
WHERE (store_name IS NULL OR store_name = '') AND name IS NOT NULL;

-- 9. 修正後のテーブル構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'stores'
ORDER BY ordinal_position;

-- 10. 完了メッセージ
SELECT 'storesテーブルの構造修正が完了しました。' as message;
