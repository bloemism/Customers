-- 店舗掲示板テーブル（シンプル版）
CREATE TABLE IF NOT EXISTS store_bulletins (
  id SERIAL PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_store_bulletins_store ON store_bulletins(store_id);
CREATE INDEX IF NOT EXISTS idx_store_bulletins_active ON store_bulletins(is_active);
