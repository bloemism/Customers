-- storesテーブルのidカラム型修正（詳細版）

-- 1. storesテーブルの詳細な構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. storesテーブルの制約情報を確認
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'stores' 
AND tc.table_schema = 'public';

-- 3. storesテーブルの現在のデータを確認
SELECT id, name, address 
FROM stores 
LIMIT 10;

-- 4. storesテーブルのidカラムをUUID型に変更（デフォルト値を削除してから）
DO $$
BEGIN
    -- まずデフォルト値を削除
    ALTER TABLE stores ALTER COLUMN id DROP DEFAULT;
    
    -- idカラムがtext型の場合のみ実行
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'id' 
        AND data_type = 'text'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'storesテーブルのidカラムをUUID型に変更します...';
        
        -- まず、idカラムのデータがUUID形式かチェック
        IF EXISTS (
            SELECT 1 FROM stores 
            WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            LIMIT 1
        ) THEN
            RAISE NOTICE 'storesテーブルのidにUUID形式でないデータがあります。新しいUUIDを生成します...';
            
            -- 新しいUUIDを生成してidを更新
            UPDATE stores 
            SET id = gen_random_uuid()::text 
            WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        END IF;
        
        -- idカラムをUUID型に変更
        ALTER TABLE stores ALTER COLUMN id TYPE UUID USING id::UUID;
        
        -- 新しいデフォルト値を設定（UUID型用）
        ALTER TABLE stores ALTER COLUMN id SET DEFAULT gen_random_uuid();
        
        RAISE NOTICE 'storesテーブルのidカラムをUUID型に変更しました';
    ELSE
        RAISE NOTICE 'storesテーブルのidカラムは既にUUID型です';
    END IF;
END $$;

-- 5. customer_paymentテーブルの構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customer_payment' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. customer_paymentテーブルの外部キー制約を確認
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'customer_payment' 
AND tc.table_schema = 'public';

-- 7. payment_codesテーブルを作成（外部キー制約付き）
CREATE TABLE IF NOT EXISTS payment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(5) NOT NULL UNIQUE,
  store_id UUID NOT NULL,
  payment_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 外部キー制約を追加
ALTER TABLE payment_codes 
ADD CONSTRAINT payment_codes_store_id_fkey 
FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- 9. インデックス作成
CREATE INDEX IF NOT EXISTS idx_payment_codes_code ON payment_codes(code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_store_id ON payment_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_expires_at ON payment_codes(expires_at);

-- 10. コード生成関数
CREATE OR REPLACE FUNCTION generate_payment_code()
RETURNS VARCHAR(5) AS $$
DECLARE
  new_code VARCHAR(5);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- 5桁の数字を生成（10000-99999）
    new_code := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    
    -- 既存コードチェック
    SELECT EXISTS(SELECT 1 FROM payment_codes WHERE code = new_code) INTO code_exists;
    
    -- 期限切れチェック（期限切れの場合は再利用可能）
    IF code_exists THEN
      DELETE FROM payment_codes WHERE code = new_code AND expires_at < NOW();
      SELECT EXISTS(SELECT 1 FROM payment_codes WHERE code = new_code) INTO code_exists;
    END IF;
    
    -- 重複がなければ終了
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 11. RLS設定
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;

-- 12. ポリシー設定
CREATE POLICY "Enable all access for store owners" ON payment_codes
FOR ALL USING (auth.uid() = (SELECT user_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Customers can view valid payment codes" ON payment_codes
FOR SELECT USING (expires_at > NOW() AND used_at IS NULL);

-- 13. 最終確認
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('stores', 'customer_payment', 'payment_codes') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 14. 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE 'storesテーブルのid型変更とpayment_codesテーブル作成が完了しました！';
    RAISE NOTICE 'customer_paymentテーブルの構造も確認されました';
END $$;
