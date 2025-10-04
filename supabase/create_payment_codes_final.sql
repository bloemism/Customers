-- payment_codesテーブル作成（最終版）

-- 1. 既存のpayment_codesテーブルを削除（存在する場合）
DROP TABLE IF EXISTS payment_codes CASCADE;

-- 2. payment_codesテーブルを作成
CREATE TABLE payment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(5) NOT NULL UNIQUE,
  store_id UUID NOT NULL,
  payment_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_payment_codes_code ON payment_codes(code);
CREATE INDEX IF NOT EXISTS idx_payment_codes_store_id ON payment_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_codes_expires_at ON payment_codes(expires_at);

-- 4. 5桁のランダムコード生成関数
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

-- 5. 期限切れデータの自動削除用関数
CREATE OR REPLACE FUNCTION cleanup_expired_payment_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM payment_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 6. RLSを有効化
ALTER TABLE payment_codes ENABLE ROW LEVEL SECURITY;

-- 7. 基本的なポリシー設定（user_id問題を回避）
-- 全ユーザーが参照可能（期限切れでないもののみ）
CREATE POLICY "Enable read access for valid codes" ON payment_codes
FOR SELECT USING (expires_at > NOW() AND used_at IS NULL);

-- 全ユーザーが挿入可能（店舗側でのコード生成用）
CREATE POLICY "Enable insert access for all users" ON payment_codes
FOR INSERT WITH CHECK (true);

-- 全ユーザーが更新可能（使用済みマーク用）
CREATE POLICY "Enable update access for all users" ON payment_codes
FOR UPDATE USING (true);

-- 8. テスト用データ挿入（動作確認用）
INSERT INTO payment_codes (code, store_id, payment_data, expires_at)
VALUES (
  '12345',
  gen_random_uuid(), -- 仮のstore_id
  '{
    "type": "payment",
    "storeId": "test-store-uuid",
    "storeName": "テスト花屋",
    "storeAddress": "東京都渋谷区",
    "storePhone": "03-1234-5678",
    "storeEmail": "test@example.com",
    "items": [
      {
        "id": "rose_001",
        "name": "バラの花束",
        "price": 3000,
        "quantity": 1,
        "total": 3000
      }
    ],
    "subtotal": 3000,
    "tax": 300,
    "totalAmount": 3300,
    "pointsUsed": 100,
    "pointsEarned": 33,
    "timestamp": "2024-01-15T10:30:00Z"
  }'::jsonb,
  NOW() + INTERVAL '5 minutes'
);

-- 9. テーブル構造確認
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. テストデータ確認
SELECT 
    code,
    store_id,
    payment_data->>'storeName' as store_name,
    payment_data->'totalAmount' as total_amount,
    expires_at,
    used_at
FROM payment_codes 
WHERE code = '12345';

-- 11. 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE 'payment_codesテーブルの作成が完了しました！';
    RAISE NOTICE 'テストデータ（コード: 12345）も挿入されました';
END $$;
