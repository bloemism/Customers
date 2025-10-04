-- payment_codesテーブルのstore_idカラムをTEXT型に変更

-- 1. 現在のpayment_codesテーブル構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 外部キー制約を削除（存在する場合）
ALTER TABLE payment_codes DROP CONSTRAINT IF EXISTS payment_codes_store_id_fkey;

-- 3. store_idカラムをTEXT型に変更
ALTER TABLE payment_codes ALTER COLUMN store_id TYPE TEXT;

-- 4. インデックスを再作成
DROP INDEX IF EXISTS idx_payment_codes_store_id;
CREATE INDEX idx_payment_codes_store_id ON payment_codes(store_id);

-- 5. 変更後の構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. テストデータを挿入（store_idをTEXT型で）
INSERT INTO payment_codes (code, store_id, payment_data, expires_at)
VALUES (
  '54321',
  'id-1757758560448', -- TEXT型のstore_id
  '{
    "type": "payment",
    "storeId": "id-1757758560448",
    "storeName": "ブルームンウインクル　元アトリエ",
    "storeAddress": "東京都港区芝5-10-4",
    "storePhone": "09014042509",
    "storeEmail": "info@example.com",
    "items": [
      {
        "id": "flower_001",
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
) ON CONFLICT (code) DO UPDATE SET
  store_id = EXCLUDED.store_id,
  payment_data = EXCLUDED.payment_data,
  expires_at = EXCLUDED.expires_at;

-- 7. テストデータ確認
SELECT 
    code,
    store_id,
    payment_data->>'storeName' as store_name,
    payment_data->'totalAmount' as total_amount,
    expires_at
FROM payment_codes 
WHERE code IN ('12345', '54321');

-- 8. 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE 'payment_codesテーブルのstore_idをTEXT型に変更しました！';
    RAISE NOTICE 'テストデータ（コード: 54321）も挿入されました';
END $$;

