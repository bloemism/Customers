-- 現在のデータを確認

-- 1. storesテーブルのphotosカラムを確認
SELECT id, store_name, photos FROM stores WHERE id = 'store-001';

-- 2. store_imagesテーブルのデータを確認
SELECT * FROM store_images WHERE store_id = 'store-001';

-- 3. 古いphotosカラムをクリア
UPDATE stores SET photos = NULL WHERE id = 'store-001';

-- 4. 確認
SELECT id, store_name, photos FROM stores WHERE id = 'store-001';
