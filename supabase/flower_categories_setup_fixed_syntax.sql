-- フラワーカテゴリ管理システムのセットアップ（構文エラー修正版）
-- 既存のstoresテーブル構造に合わせて作成

-- 1. 既存のテーブルを削除（クリーンアップ）
DROP TABLE IF EXISTS flower_item_categories CASCADE;
DROP TABLE IF EXISTS color_categories CASCADE;
DROP VIEW IF EXISTS store_category_stats CASCADE;

-- 2. 品目カテゴリテーブル（最大30個）
CREATE TABLE IF NOT EXISTS flower_item_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, name)
);

-- 3. 色カテゴリテーブル（最大10個）
CREATE TABLE IF NOT EXISTS color_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  name VARCHAR(50) NOT NULL,
  hex_code VARCHAR(7),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, name)
);

-- 4. インデックス作成
CREATE INDEX IF NOT EXISTS idx_flower_item_categories_store_id ON flower_item_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_color_categories_store_id ON color_categories(store_id);

-- 5. 制限チェック関数（品目カテゴリ最大30個）
CREATE OR REPLACE FUNCTION check_flower_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    IF (SELECT COUNT(*) FROM flower_item_categories 
        WHERE store_id = NEW.store_id AND is_active = true) > 30 THEN
      RAISE EXCEPTION '品目カテゴリは店舗ごとに最大30個までです';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 制限チェック関数（色カテゴリ最大10個）
CREATE OR REPLACE FUNCTION check_color_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    IF (SELECT COUNT(*) FROM color_categories 
        WHERE store_id = NEW.store_id AND is_active = true) > 10 THEN
      RAISE EXCEPTION '色カテゴリは店舗ごとに最大10個までです';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. トリガー作成
DROP TRIGGER IF EXISTS check_flower_item_limit_trigger ON flower_item_categories;
CREATE TRIGGER check_flower_item_limit_trigger
  BEFORE INSERT OR UPDATE ON flower_item_categories
  FOR EACH ROW EXECUTE FUNCTION check_flower_item_limit();

DROP TRIGGER IF EXISTS check_color_limit_trigger ON color_categories;
CREATE TRIGGER check_color_limit_trigger
  BEFORE INSERT OR UPDATE ON color_categories
  FOR EACH ROW EXECUTE FUNCTION check_color_limit();

-- 8. 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_flower_item_categories_updated_at ON flower_item_categories;
CREATE TRIGGER update_flower_item_categories_updated_at
  BEFORE UPDATE ON flower_item_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_color_categories_updated_at ON color_categories;
CREATE TRIGGER update_color_categories_updated_at
  BEFORE UPDATE ON color_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 統計ビュー
CREATE OR REPLACE VIEW store_category_stats AS
SELECT 
  s.name as store_name,
  s.id as store_id,
  COUNT(DISTINCT fic.id) as flower_item_count,
  COUNT(DISTINCT cc.id) as color_count
FROM stores s
LEFT JOIN flower_item_categories fic ON s.id = fic.store_id AND fic.is_active = true
LEFT JOIN color_categories cc ON s.id = cc.store_id AND cc.is_active = true
GROUP BY s.id, s.name
ORDER BY s.name;

-- 10. 権限設定
GRANT SELECT, INSERT, UPDATE, DELETE ON flower_item_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON color_categories TO authenticated;
GRANT SELECT ON store_category_stats TO authenticated;
