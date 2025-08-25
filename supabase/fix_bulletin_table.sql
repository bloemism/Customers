-- 掲示板テーブルの修正

-- 既存のテーブルを削除（もし存在する場合）
DROP TABLE IF EXISTS store_bulletins CASCADE;

-- 掲示板テーブルを再作成
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

-- RLS設定
ALTER TABLE store_bulletins ENABLE ROW LEVEL SECURITY;

-- 掲示板のポリシー
CREATE POLICY "Anyone can view active store bulletins" ON store_bulletins FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage their store bulletins" ON store_bulletins FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_bulletins.store_id AND stores.email = auth.jwt() ->> 'email')
);

-- インデックス作成
CREATE INDEX idx_store_bulletins_store ON store_bulletins(store_id);
CREATE INDEX idx_store_bulletins_active ON store_bulletins(is_active);

-- 更新日時トリガー関数（既に存在する場合はスキップ）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 店舗掲示板の更新日時トリガー
DROP TRIGGER IF EXISTS update_store_bulletins_updated_at ON store_bulletins;
CREATE TRIGGER update_store_bulletins_updated_at 
    BEFORE UPDATE ON store_bulletins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
