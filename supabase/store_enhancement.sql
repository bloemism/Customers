-- 店舗機能拡張: 画像、掲示板、タグ機能

-- 店舗画像テーブル（既存のstore_imagesを拡張）
CREATE TABLE IF NOT EXISTS store_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'gallery', -- 'primary', 'gallery', 'banner'
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 店舗掲示板テーブル
CREATE TABLE IF NOT EXISTS store_bulletins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 店舗タグテーブル
CREATE TABLE IF NOT EXISTS store_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- デフォルトは青色
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 店舗とタグの関連テーブル
CREATE TABLE IF NOT EXISTS store_tag_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  tag_id UUID REFERENCES store_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, tag_id)
);

-- 店舗テーブルに新しいフィールドを追加
ALTER TABLE stores ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT false;

-- RLS設定
ALTER TABLE store_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_tag_relations ENABLE ROW LEVEL SECURITY;

-- 店舗画像のポリシー
CREATE POLICY "Anyone can view store images" ON store_images FOR SELECT USING (true);
CREATE POLICY "Store owners can manage their store images" ON store_images FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_images.store_id AND stores.email = auth.jwt() ->> 'email')
);

-- 店舗掲示板のポリシー
CREATE POLICY "Anyone can view active store bulletins" ON store_bulletins FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage their store bulletins" ON store_bulletins FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_bulletins.store_id AND stores.email = auth.jwt() ->> 'email')
);

-- 店舗タグのポリシー
CREATE POLICY "Anyone can view store tags" ON store_tags FOR SELECT USING (true);
CREATE POLICY "Store owners can manage store tags" ON store_tags FOR ALL USING (true);

-- 店舗タグ関連のポリシー
CREATE POLICY "Anyone can view store tag relations" ON store_tag_relations FOR SELECT USING (true);
CREATE POLICY "Store owners can manage their store tag relations" ON store_tag_relations FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_tag_relations.store_id AND stores.email = auth.jwt() ->> 'email')
);

-- 初期タグデータ
INSERT INTO store_tags (name, color) VALUES
('花束専門', '#FF6B6B'),
('アレンジメント', '#4ECDC4'),
('観葉植物', '#45B7D1'),
('ギフト対応', '#96CEB4'),
('デリバリー', '#FFEAA7'),
('駐車場あり', '#DDA0DD'),
('24時間営業', '#98D8C8'),
('予約制', '#F7DC6F'),
('体験レッスン', '#BB8FCE'),
('季節の花', '#85C1E9')
ON CONFLICT (name) DO NOTHING;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_store_images_store ON store_images(store_id);
CREATE INDEX IF NOT EXISTS idx_store_bulletins_store ON store_bulletins(store_id);
CREATE INDEX IF NOT EXISTS idx_store_bulletins_active ON store_bulletins(is_active);
CREATE INDEX IF NOT EXISTS idx_store_tag_relations_store ON store_tag_relations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_tag_relations_tag ON store_tag_relations(tag_id);

-- 更新日時トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 店舗掲示板の更新日時トリガー
CREATE TRIGGER update_store_bulletins_updated_at 
    BEFORE UPDATE ON store_bulletins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
