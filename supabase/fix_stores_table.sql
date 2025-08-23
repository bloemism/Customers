-- 店舗テーブルの復旧スクリプト
-- このスクリプトは基本的な店舗テーブルを作成し、サンプルデータを投入します

-- 1. 既存のstoresテーブルが存在する場合は削除
DROP TABLE IF EXISTS stores CASCADE;

-- 2. 基本的なstoresテーブルを作成
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL, -- 認証ユーザーのID
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  business_hours TEXT,
  parking BOOLEAN DEFAULT false,
  bulletin_board TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. インデックスを作成
CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_stores_location ON stores(latitude, longitude);

-- 4. RLSを有効化
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 5. 基本的なポリシーを作成
CREATE POLICY "店舗オーナーのみ読み取り可能" ON stores
    FOR SELECT USING (auth.uid()::text = owner_id);

CREATE POLICY "店舗オーナーのみ挿入可能" ON stores
    FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "店舗オーナーのみ更新可能" ON stores
    FOR UPDATE USING (auth.uid()::text = owner_id);

CREATE POLICY "店舗オーナーのみ削除可能" ON stores
    FOR DELETE USING (auth.uid()::text = owner_id);

-- 6. サンプル店舗データを挿入（テスト用）
-- 注意: 実際のowner_idは認証後に取得する必要があります
INSERT INTO stores (owner_id, name, address, phone, email, description, business_hours, parking, latitude, longitude) VALUES
  ('test-user-1', 'サンプル花屋', '東京都渋谷区1-1-1', '03-1234-5678', 'sample@flower.com', '美しい花を提供する花屋です', '9:00-18:00', true, 35.658034, 139.701636),
  ('test-user-2', 'フローリストガーデン', '大阪府大阪市2-2-2', '06-2345-6789', 'garden@flower.com', '四季折々の花を楽しめる花屋です', '8:00-19:00', false, 34.702485, 135.495951);

-- 7. 商品管理用の基本的なテーブルも作成
CREATE TABLE IF NOT EXISTS product_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 商品管理テーブルのインデックス
CREATE INDEX idx_product_items_store_id ON product_items(store_id);
CREATE INDEX idx_product_items_category ON product_items(category);
CREATE INDEX idx_product_items_color ON product_items(color);

-- 9. 商品管理テーブルのRLS
ALTER TABLE product_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "店舗オーナーのみ商品を読み取り可能" ON product_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM stores 
        WHERE stores.id = product_items.store_id 
        AND stores.owner_id = auth.uid()::text
      )
    );

CREATE POLICY "店舗オーナーのみ商品を挿入可能" ON product_items
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM stores 
        WHERE stores.id = product_items.store_id 
        AND stores.owner_id = auth.uid()::text
      )
    );

CREATE POLICY "店舗オーナーのみ商品を更新可能" ON product_items
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM stores 
        WHERE stores.id = product_items.store_id 
        AND stores.owner_id = auth.uid()::text
      )
    );

CREATE POLICY "店舗オーナーのみ商品を削除可能" ON product_items
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM stores 
        WHERE stores.id = product_items.store_id 
        AND stores.owner_id = auth.uid()::text
      )
    );

-- 10. サンプル商品データを挿入
INSERT INTO product_items (store_id, name, category, color, is_active) 
SELECT 
  s.id,
  'バラ',
  '花',
  '赤',
  true
FROM stores s WHERE s.owner_id = 'test-user-1'
UNION ALL
SELECT 
  s.id,
  'バラ',
  '花',
  '白',
  true
FROM stores s WHERE s.owner_id = 'test-user-1'
UNION ALL
SELECT 
  s.id,
  'アルストロメリア',
  '花',
  'ピンク',
  true
FROM stores s WHERE s.owner_id = 'test-user-1';

-- 完了メッセージ
SELECT '店舗テーブルの復旧が完了しました。' as message;
