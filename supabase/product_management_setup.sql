-- 商品管理システムのセットアップ

-- 商品カテゴリテーブル
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品テーブル
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  base_price INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品価格履歴テーブル（価格変更の履歴を保持）
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  old_price INTEGER,
  new_price INTEGER NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_price_history_product_id ON product_price_history(product_id);

-- RLSポリシーの設定
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;

-- 商品カテゴリのポリシー（読み取りのみ）
CREATE POLICY "商品カテゴリは誰でも読み取り可能" ON product_categories
  FOR SELECT USING (true);

-- 商品のポリシー（店舗オーナーのみ管理可能）
CREATE POLICY "店舗オーナーは自分の店舗の商品を管理可能" ON products
  FOR ALL USING (
    store_id IN (
      SELECT id FROM stores 
      WHERE owner_id = auth.uid()
    )
  );

-- 商品価格履歴のポリシー（店舗オーナーのみ読み取り可能）
CREATE POLICY "店舗オーナーは自分の店舗の価格履歴を読み取り可能" ON product_price_history
  FOR SELECT USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  );

-- 商品価格履歴のポリシー（店舗オーナーのみ挿入可能）
CREATE POLICY "店舗オーナーは自分の店舗の価格履歴を挿入可能" ON product_price_history
  FOR INSERT WITH CHECK (
    product_id IN (
      SELECT p.id FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  );

-- サンプルデータの挿入
INSERT INTO product_categories (name, description) VALUES
  ('バラ', '様々な色と種類のバラ'),
  ('アルストロメリア', '長持ちする切り花'),
  ('アレンジメント', '花のアレンジメント'),
  ('配送力', '配送用の花材'),
  ('ラン鉢', '蘭の栽培用鉢'),
  ('季節の枝物', '季節に応じた枝物'),
  ('ガラス', '花瓶や装飾用ガラス'),
  ('資材', '花屋の業務用資材'),
  ('花束', '様々なスタイルの花束'),
  ('ブーケ', 'ウェディング用ブーケ'),
  ('コサージュ', '胸元に飾る花'),
  ('リース', 'ドアや壁に飾る花輪'),
  ('花器', '花を生ける器'),
  ('ラッピング', '花の包装材'),
  ('リボン', '装飾用リボン'),
  ('花束台', '花束を立てる台'),
  ('花瓶', '花を生ける花瓶'),
  ('植木鉢', '植物を植える鉢'),
  ('肥料', '植物の栄養剤'),
  ('土', '植物栽培用の土'),
  ('種', '花の種'),
  ('球根', '花の球根'),
  ('苗', '花の苗'),
  ('切り花', '生花の切り花'),
  ('ドライフラワー', '乾燥させた花'),
  ('プリザーブドフラワー', '保存処理された花'),
  ('アーティフィシャルフラワー', '人工の花'),
  ('花の小物', '花に関連する小物'),
  ('花の本', '花に関する書籍'),
  ('花の雑誌', '花に関する雑誌')
ON CONFLICT (name) DO NOTHING;

-- サンプル商品データ（店舗IDは後で更新）
INSERT INTO products (name, category, color, base_price, store_id) VALUES
  ('赤いバラ', 'バラ', '赤', 500, NULL),
  ('白いバラ', 'バラ', '白', 500, NULL),
  ('ピンクのバラ', 'バラ', '淡ピンク', 500, NULL),
  ('黄色いバラ', 'バラ', '黄', 500, NULL),
  ('青いバラ', 'バラ', '青', 600, NULL),
  ('赤いアルストロメリア', 'アルストロメリア', '赤', 300, NULL),
  ('ピンクのアルストロメリア', 'アルストロメリア', '淡ピンク', 300, NULL),
  ('白いアルストロメリア', 'アルストロメリア', '白', 300, NULL),
  ('赤い花束', '花束', '赤', 2000, NULL),
  ('ピンクの花束', '花束', '淡ピンク', 2000, NULL),
  ('白い花束', '花束', '白', 2000, NULL),
  ('赤いブーケ', 'ブーケ', '赤', 3000, NULL),
  ('ピンクのブーケ', 'ブーケ', '淡ピンク', 3000, NULL),
  ('白いブーケ', 'ブーケ', '白', 3000, NULL),
  ('赤いコサージュ', 'コサージュ', '赤', 800, NULL),
  ('ピンクのコサージュ', 'コサージュ', '淡ピンク', 800, NULL),
  ('白いコサージュ', 'コサージュ', '白', 800, NULL),
  ('赤いリース', 'リース', '赤', 1500, NULL),
  ('ピンクのリース', 'リース', '淡ピンク', 1500, NULL),
  ('白いリース', 'リース', '白', 1500, NULL),
  ('ガラス花瓶', 'ガラス', '透明', 1200, NULL),
  ('陶器の花瓶', '花器', '白', 800, NULL),
  ('木製の花瓶', '花器', '茶色', 1000, NULL),
  ('ラッピングペーパー', 'ラッピング', '白', 100, NULL),
  ('リボン（赤）', 'リボン', '赤', 50, NULL),
  ('リボン（ピンク）', 'リボン', '淡ピンク', 50, NULL),
  ('リボン（白）', 'リボン', '白', 50, NULL),
  ('花束台', '花束台', '白', 500, NULL),
  ('植木鉢（小）', '植木鉢', '茶色', 300, NULL),
  ('植木鉢（中）', '植木鉢', '茶色', 500, NULL),
  ('植木鉢（大）', '植木鉢', '茶色', 800, NULL),
  ('花の肥料', '肥料', '茶色', 200, NULL),
  ('花の土', '土', '茶色', 150, NULL),
  ('花の種', '種', '茶色', 100, NULL),
  ('花の球根', '球根', '茶色', 200, NULL),
  ('花の苗', '苗', '緑', 300, NULL),
  ('切り花セット', '切り花', '混色', 1000, NULL),
  ('ドライフラワーセット', 'ドライフラワー', '混色', 800, NULL),
  ('プリザーブドフラワーセット', 'プリザーブドフラワー', '混色', 1200, NULL),
  ('アーティフィシャルフラワーセット', 'アーティフィシャルフラワー', '混色', 1500, NULL),
  ('花の小物セット', '花の小物', '混色', 500, NULL),
  ('花の本', '花の本', '混色', 800, NULL),
  ('花の雑誌', '花の雑誌', '混色', 300, NULL)
ON CONFLICT DO NOTHING;

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at 
  BEFORE UPDATE ON product_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 商品価格変更時の履歴記録トリガー
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.base_price != NEW.base_price THEN
    INSERT INTO product_price_history (product_id, old_price, new_price, changed_by)
    VALUES (NEW.id, OLD.base_price, NEW.base_price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_product_price_change
  AFTER UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION log_price_change();
