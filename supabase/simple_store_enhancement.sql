-- 店舗機能拡張: シンプル版

-- 1. 店舗テーブルに新しいカラムを追加
ALTER TABLE stores ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT false;

-- 2. 店舗画像テーブル
DROP TABLE IF EXISTS store_images CASCADE;
CREATE TABLE store_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 店舗掲示板テーブル
DROP TABLE IF EXISTS store_bulletins CASCADE;
CREATE TABLE store_bulletins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 店舗タグテーブル
DROP TABLE IF EXISTS store_tags CASCADE;
CREATE TABLE store_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#FF6B6B',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 店舗タグ関連テーブル
DROP TABLE IF EXISTS store_tag_relations CASCADE;
CREATE TABLE store_tag_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  tag_id UUID NOT NULL REFERENCES store_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, tag_id)
);

-- 6. RLS設定
ALTER TABLE store_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_tag_relations ENABLE ROW LEVEL SECURITY;

-- 7. シンプルなポリシー
CREATE POLICY "Allow all operations on store_images" ON store_images FOR ALL USING (true);
CREATE POLICY "Allow all operations on store_bulletins" ON store_bulletins FOR ALL USING (true);
CREATE POLICY "Allow all operations on store_tags" ON store_tags FOR ALL USING (true);
CREATE POLICY "Allow all operations on store_tag_relations" ON store_tag_relations FOR ALL USING (true);

-- 8. インデックス作成
CREATE INDEX idx_store_images_store ON store_images(store_id);
CREATE INDEX idx_store_images_active ON store_images(is_active);
CREATE INDEX idx_store_bulletins_store ON store_bulletins(store_id);
CREATE INDEX idx_store_bulletins_active ON store_bulletins(is_active);
CREATE INDEX idx_store_tag_relations_store ON store_tag_relations(store_id);
CREATE INDEX idx_store_tag_relations_tag ON store_tag_relations(tag_id);

-- 9. 更新日時トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. 更新日時トリガー
DROP TRIGGER IF EXISTS update_store_images_updated_at ON store_images;
CREATE TRIGGER update_store_images_updated_at 
    BEFORE UPDATE ON store_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_bulletins_updated_at ON store_bulletins;
CREATE TRIGGER update_store_bulletins_updated_at 
    BEFORE UPDATE ON store_bulletins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. 初期タグデータ挿入
INSERT INTO store_tags (name, color) VALUES
  ('切花', '#FF6B6B'),
  ('鉢花', '#4ECDC4'),
  ('観葉植物', '#45B7D1'),
  ('苗もの', '#96CEB4'),
  ('ラン鉢', '#FFEAA7'),
  ('花束', '#DDA0DD'),
  ('アレンジメント', '#98D8C8'),
  ('ウエディングブーケ', '#F7DC6F'),
  ('ブライダル', '#BB8FCE'),
  ('コサージュ', '#85C1E9'),
  ('スタンド花', '#F8C471'),
  ('定期装花', '#82E0AA'),
  ('配送', '#F1948A'),
  ('お届け', '#85C1E9'),
  ('造花', '#D7BDE2'),
  ('プリザーブド', '#FAD7A0'),
  ('仏花', '#A9CCE3'),
  ('葬儀', '#7FB3D3'),
  ('ガーデニング', '#82E0AA'),
  ('花器', '#F8C471'),
  ('ガーデン資材', '#F7DC6F')
ON CONFLICT (name) DO NOTHING;

-- 12. 権限設定
GRANT ALL ON store_images TO authenticated;
GRANT ALL ON store_bulletins TO authenticated;
GRANT ALL ON store_tags TO authenticated;
GRANT ALL ON store_tag_relations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
