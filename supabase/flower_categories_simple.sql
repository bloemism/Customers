-- フラワーカテゴリ管理システムのセットアップ（シンプル版）
-- 構文エラーを完全に修正

-- 1. 既存のテーブルを削除
DROP TABLE IF EXISTS flower_item_categories CASCADE;
DROP TABLE IF EXISTS color_categories CASCADE;
DROP VIEW IF EXISTS store_category_stats CASCADE;

-- 2. 品目カテゴリテーブル
CREATE TABLE flower_item_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 色カテゴリテーブル
CREATE TABLE color_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  name VARCHAR(50) NOT NULL,
  hex_code VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ユニーク制約
ALTER TABLE flower_item_categories ADD CONSTRAINT unique_store_item_name UNIQUE(store_id, name);
ALTER TABLE color_categories ADD CONSTRAINT unique_store_color_name UNIQUE(store_id, name);

-- 5. インデックス作成
CREATE INDEX idx_flower_item_categories_store_id ON flower_item_categories(store_id);
CREATE INDEX idx_color_categories_store_id ON color_categories(store_id);

-- 6. 権限設定
GRANT SELECT, INSERT, UPDATE, DELETE ON flower_item_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON color_categories TO authenticated;
