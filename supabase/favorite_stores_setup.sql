-- 顧客のお気に入り店舗管理テーブル（店舗側アプリ用）
-- 顧客が店舗をお気に入りに登録・分類するためのテーブル
-- 注意: 既存のstoresテーブルのid型に合わせて調整
CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- 顧客のID
  store_id TEXT NOT NULL, -- 店舗のID（既存のstoresテーブルの型に合わせる）
  status TEXT NOT NULL DEFAULT 'favorite', -- 'favorite', 'interested', 'visited'
  notes TEXT, -- 顧客が記入するメモ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, store_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer_id ON customer_favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_store_id ON customer_favorites(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_status ON customer_favorites(status);

-- RLS（Row Level Security）の有効化
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
CREATE POLICY "Customers can view their own favorites" ON customer_favorites
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert their own favorites" ON customer_favorites
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own favorites" ON customer_favorites
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete their own favorites" ON customer_favorites
  FOR DELETE USING (auth.uid() = customer_id);

-- 店舗オーナーが自分の店舗のお気に入り状況を確認できるポリシー
CREATE POLICY "Store owners can view favorites for their stores" ON customer_favorites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id::TEXT = customer_favorites.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- 関数の作成：顧客が店舗をお気に入りに登録
CREATE OR REPLACE FUNCTION add_customer_favorite(
  p_store_id TEXT,
  p_status TEXT DEFAULT 'favorite',
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO customer_favorites (customer_id, store_id, status, notes)
  VALUES (auth.uid(), p_store_id, p_status, p_notes)
  ON CONFLICT (customer_id, store_id)
  DO UPDATE SET 
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数の作成：顧客のお気に入り状況を取得
CREATE OR REPLACE FUNCTION get_customer_favorite_status(p_store_id TEXT)
RETURNS TABLE(
  status TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cf.status,
    cf.notes,
    cf.created_at
  FROM customer_favorites cf
  WHERE cf.store_id = p_store_id 
    AND cf.customer_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数の作成：顧客のお気に入り店舗一覧を取得
CREATE OR REPLACE FUNCTION get_customer_favorite_stores(p_status TEXT DEFAULT NULL)
RETURNS TABLE(
  store_id TEXT,
  store_name TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id::TEXT as store_id,
    s.name as store_name,
    s.address,
    s.latitude,
    s.longitude,
    cf.status,
    cf.notes,
    cf.created_at
  FROM customer_favorites cf
  JOIN stores s ON cf.store_id = s.id::TEXT
  WHERE cf.customer_id = auth.uid()
    AND s.is_active = true
    AND (p_status IS NULL OR cf.status = p_status)
  ORDER BY cf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 店舗のお気に入り登録数を取得する関数（店舗オーナー用）
CREATE OR REPLACE FUNCTION get_store_favorite_count(p_store_id TEXT)
RETURNS TABLE(
  total_favorites INTEGER,
  favorite_count INTEGER,
  interested_count INTEGER,
  visited_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_favorites,
    COUNT(*) FILTER (WHERE status = 'favorite')::INTEGER as favorite_count,
    COUNT(*) FILTER (WHERE status = 'interested')::INTEGER as interested_count,
    COUNT(*) FILTER (WHERE status = 'visited')::INTEGER as visited_count
  FROM customer_favorites
  WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
