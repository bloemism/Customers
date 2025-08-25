-- フラワーカテゴリ管理システムのセットアップ
-- シンプルで確実に動作する構造に整理

-- 1. 既存のテーブルを削除（クリーンアップ）
DROP TABLE IF EXISTS flower_item_categories CASCADE;
DROP TABLE IF EXISTS color_categories CASCADE;
DROP VIEW IF EXISTS store_category_stats CASCADE;

-- 2. シンプルなstoresテーブルを作成
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL, -- 認証ユーザーのID
  name TEXT NOT NULL, -- 店舗名
  address TEXT, -- 住所
  phone TEXT, -- 電話番号
  email TEXT, -- メールアドレス
  website TEXT, -- ウェブサイト
  instagram TEXT, -- Instagram
  business_hours TEXT, -- 営業時間
  parking BOOLEAN DEFAULT false, -- 駐車場
  description TEXT, -- 店舗説明
  is_active BOOLEAN DEFAULT true, -- 有効/無効
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 品目カテゴリテーブル（最大30個）
CREATE TABLE IF NOT EXISTS flower_item_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL, -- 店舗ID（stores.idを文字列として参照）
  name VARCHAR(100) NOT NULL, -- 品目名
  description TEXT, -- 説明
  is_active BOOLEAN DEFAULT true, -- 有効/無効
  display_order INTEGER DEFAULT 0, -- 表示順序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, name)
);

-- 4. 色カテゴリテーブル（最大10個）
CREATE TABLE IF NOT EXISTS color_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL, -- 店舗ID（stores.idを文字列として参照）
  name VARCHAR(50) NOT NULL, -- 色名
  hex_code VARCHAR(7), -- カラーコード（#RRGGBB）
  description TEXT, -- 説明
  is_active BOOLEAN DEFAULT true, -- 有効/無効
  display_order INTEGER DEFAULT 0, -- 表示順序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, name)
);

-- 5. インデックス作成
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);
CREATE INDEX IF NOT EXISTS idx_flower_item_categories_store_id ON flower_item_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_color_categories_store_id ON color_categories(store_id);

-- 6. 制限チェック関数（品目カテゴリ最大30個）
CREATE OR REPLACE FUNCTION check_flower_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- 新規追加時またはis_activeがfalseからtrueに変更される場合
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    -- 同じ店舗の有効な品目カテゴリ数をチェック
    IF (SELECT COUNT(*) FROM flower_item_categories 
        WHERE store_id = NEW.store_id AND is_active = true) > 30 THEN
      RAISE EXCEPTION '品目カテゴリは店舗ごとに最大30個までです';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 制限チェック関数（色カテゴリ最大10個）
CREATE OR REPLACE FUNCTION check_color_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- 新規追加時またはis_activeがfalseからtrueに変更される場合
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    -- 同じ店舗の有効な色カテゴリ数をチェック
    IF (SELECT COUNT(*) FROM color_categories 
        WHERE store_id = NEW.store_id AND is_active = true) > 10 THEN
      RAISE EXCEPTION '色カテゴリは店舗ごとに最大10個までです';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. トリガー作成
DROP TRIGGER IF EXISTS check_flower_item_limit_trigger ON flower_item_categories;
CREATE TRIGGER check_flower_item_limit_trigger
  BEFORE INSERT OR UPDATE ON flower_item_categories
  FOR EACH ROW EXECUTE FUNCTION check_flower_item_limit();

DROP TRIGGER IF EXISTS check_color_limit_trigger ON color_categories;
CREATE TRIGGER check_color_limit_trigger
  BEFORE INSERT OR UPDATE ON color_categories
  FOR EACH ROW EXECUTE FUNCTION check_color_limit();

-- 9. 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flower_item_categories_updated_at ON flower_item_categories;
CREATE TRIGGER update_flower_item_categories_updated_at
  BEFORE UPDATE ON flower_item_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_color_categories_updated_at ON color_categories;
CREATE TRIGGER update_color_categories_updated_at
  BEFORE UPDATE ON color_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. シンプルな統計ビュー
CREATE OR REPLACE VIEW store_category_stats AS
SELECT 
  s.name as store_name,
  s.id as store_id,
  COUNT(DISTINCT fic.id) as flower_item_count,
  COUNT(DISTINCT cc.id) as color_count
FROM stores s
LEFT JOIN flower_item_categories fic ON s.id::text = fic.store_id AND fic.is_active = true
LEFT JOIN color_categories cc ON s.id::text = cc.store_id AND cc.is_active = true
GROUP BY s.id, s.name
ORDER BY s.name;

-- 11. 権限設定
GRANT SELECT, INSERT, UPDATE, DELETE ON stores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON flower_item_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON color_categories TO authenticated;
GRANT SELECT ON store_category_stats TO authenticated;
