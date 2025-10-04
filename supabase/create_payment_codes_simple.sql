-- 段階的アプローチ：payment_codesテーブル作成

-- 1. storesテーブルの構造確認
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. storesテーブルのid型をUUIDに変更（必要な場合のみ）
-- 注意：このコマンドはstoresテーブルがtext型の場合のみ実行してください
-- ALTER TABLE stores ALTER COLUMN id TYPE UUID USING id::UUID;

-- 3. payment_codesテーブル作成（storesがUUID型であることを前提）
CREATE TABLE IF NOT EXISTS payment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(5) NOT NULL UNIQUE,
  store_id UUID NOT NULL,
  payment_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 外部キー制約を追加（storesテーブルがUUID型の場合のみ）
-- 注意：stores.idがUUID型でない場合は、この行をコメントアウトしてください
ALTER TABLE payment_codes 
ADD CONSTRAINT payment_codes_store_id_fkey 
FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- 5. インデックス作成
CREATE INDEX IF NOT EXISTS idx_payment_codes_code ON payment_codes(code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_store_id ON payment_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_expires_at ON payment_codes(expires_at);

-- 6. コード生成関数
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

-- 7. RLS設定
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;

-- 8. ポリシー設定
CREATE POLICY "Enable all access for store owners" ON payment_codes
FOR ALL USING (auth.uid() = (SELECT user_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Customers can view valid payment codes" ON payment_codes
FOR SELECT USING (expires_at > NOW() AND used_at IS NULL);

-- 9. 最終確認
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('stores', 'payment_codes') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

