-- 手動アプローチ：storesテーブルのid型修正

-- ステップ1: storesテーブルの現在の構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ステップ2: storesテーブルの現在のデータを確認
SELECT id, name, address 
FROM stores 
LIMIT 10;

-- ステップ3: idカラムのデータ形式をチェック
-- このクエリを実行して、UUID形式でないデータがあるかチェックしてください
SELECT id, name
FROM stores 
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
LIMIT 10;

-- ステップ4: UUID形式でないデータを新しいUUIDに更新（必要な場合のみ）
-- 注意：このコマンドは慎重に実行してください。既存の関連データに影響する可能性があります
-- UPDATE stores 
-- SET id = gen_random_uuid()::text 
-- WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ステップ5: storesテーブルのidカラムをUUID型に変更
-- 注意：この操作は不可逆です。実行前にバックアップを取ることをお勧めします
-- ALTER TABLE stores ALTER COLUMN id TYPE UUID USING id::UUID;

-- ステップ6: payment_codesテーブルを作成（外部キー制約なし）
CREATE TABLE IF NOT EXISTS payment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(5) NOT NULL UNIQUE,
  store_id UUID NOT NULL,
  payment_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ステップ7: 外部キー制約を追加（stores.idがUUID型になった後）
-- ALTER TABLE payment_codes 
-- ADD CONSTRAINT payment_codes_store_id_fkey 
-- FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- ステップ8: インデックス作成
CREATE INDEX IF NOT EXISTS idx_payment_codes_code ON payment_codes(code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_store_id ON payment_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_expires_at ON payment_codes(expires_at);

-- ステップ9: コード生成関数
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

-- ステップ10: RLS設定
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;

-- ステップ11: ポリシー設定
CREATE POLICY "Enable all access for store owners" ON payment_codes
FOR ALL USING (auth.uid() = (SELECT user_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Customers can view valid payment codes" ON payment_codes
FOR SELECT USING (expires_at > NOW() AND used_at IS NULL);

-- 最終確認
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('stores', 'payment_codes') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

