-- クレジットカード情報テーブル（シンプル版）
CREATE TABLE IF NOT EXISTS credit_cards (
  id SERIAL PRIMARY KEY,
  store_id VARCHAR(255),
  card_type VARCHAR(50) NOT NULL,
  last_four_digits VARCHAR(4) NOT NULL,
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  card_holder_name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_credit_cards_store_id ON credit_cards(store_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_is_active ON credit_cards(is_active);
