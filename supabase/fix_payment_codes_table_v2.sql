-- storesテーブルのidカラムの型を確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stores' AND table_schema = 'public';

-- 既存の外部キー制約を削除（存在する場合）
ALTER TABLE payment_codes DROP CONSTRAINT IF EXISTS payment_codes_store_id_fkey;

-- payment_codesテーブルを削除（存在する場合）
DROP TABLE IF EXISTS payment_codes CASCADE;

-- storesテーブルのidカラムをUUID型に変更（text型の場合のみ）
DO $$
BEGIN
    -- storesテーブルのidカラムがtext型かチェック
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'id' 
        AND data_type = 'text'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'storesテーブルのidカラムをUUID型に変更します...';
    ELSE
        RAISE NOTICE 'storesテーブルのidカラムは既にUUID型です';
    END IF;
END $$;

-- storesテーブルのidカラムをUUID型に変更（text型の場合）
ALTER TABLE stores ALTER COLUMN id TYPE UUID USING id::UUID;

-- 決済コード用テーブル作成
CREATE TABLE payment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(5) NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  payment_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_payment_codes_code ON payment_codes(code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_store_id ON payment_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_expires_at ON payment_codes(expires_at);

-- 期限切れデータの自動削除用関数
CREATE OR REPLACE FUNCTION cleanup_expired_payment_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM payment_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 5桁のランダムコード生成関数
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

-- RLSを有効化
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;

-- ポリシー: 店舗は自身の決済コードを挿入、参照、更新できる
CREATE POLICY "Enable all access for store owners" ON payment_codes
FOR ALL USING (auth.uid() = (SELECT user_id FROM public.stores WHERE id = store_id));

-- ポリシー: 顧客は有効な決済コードを参照できる（ただし、使用済みでないもの）
CREATE POLICY "Customers can view valid payment codes" ON payment_codes
FOR SELECT USING (expires_at > NOW() AND used_at IS NULL);

-- テスト用の期限切れデータクリーンアップ
SELECT cleanup_expired_payment_codes();

-- 最終確認
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name IN ('stores', 'payment_codes') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE 'payment_codesテーブルの作成が完了しました！';
END $$;
