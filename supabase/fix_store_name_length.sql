-- 店舗名の文字数制限を確認・修正するSQL

-- 1. storesテーブルの全カラム構造を確認
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stores'
ORDER BY ordinal_position;

-- 2. storesテーブルのサンプルデータを確認
SELECT * FROM stores LIMIT 3;

-- 3. 店舗名の現在のデータを確認
SELECT 
    id,
    store_name,
    LENGTH(store_name) as store_name_length,
    OCTET_LENGTH(store_name) as store_name_bytes
FROM stores 
LIMIT 10;

-- 4. 店舗名の文字数制限を拡張（必要に応じて）
-- もしVARCHAR制限がある場合は、TEXTに変更
ALTER TABLE stores 
ALTER COLUMN store_name TYPE TEXT;

-- 5. 店舗名の文字数制限を確認
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name IN ('store_name');

-- 6. 既存の店舗名を長い名前に更新（テスト用）
UPDATE stores 
SET store_name = 'ブルームンウインクル・アンド・カンパニー・インターナショナル・フローリスト・ショップ・エクスプレス・デラックス・プレミアム・エディション'
WHERE store_name LIKE '%ブルームンウインクル%';

-- 7. 更新されたデータを確認
SELECT 
    id,
    store_name,
    LENGTH(store_name) as store_name_length,
    OCTET_LENGTH(store_name) as store_name_bytes
FROM stores 
WHERE store_name LIKE '%ブルームンウインクル%'
ORDER BY updated_at DESC
LIMIT 5;
