-- storesテーブルをシンプルに作成（写真、掲示板、花タグ以外のデータ）

-- 1. 既存のstoresテーブルを削除
DROP TABLE IF EXISTS stores CASCADE;

-- 2. storesテーブルを新規作成
CREATE TABLE stores (
    id TEXT PRIMARY KEY DEFAULT 'id-' || LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0'),
    store_name TEXT NOT NULL,
    name TEXT, -- 互換性のため
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    online_shop TEXT,
    business_hours TEXT,
    description TEXT,
    parking BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    -- 銀行口座情報
    bank_name TEXT,
    branch_name TEXT,
    account_type TEXT DEFAULT '普通',
    account_number TEXT,
    account_holder TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. インデックスを作成
CREATE INDEX idx_stores_email ON stores(email);
CREATE INDEX idx_stores_store_name ON stores(store_name);

-- 4. RLSを無効化（開発中は簡単のため）
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- 5. テストデータを挿入
INSERT INTO stores (id, store_name, name, address, phone, email, website, instagram, online_shop, business_hours, description, parking, is_active, bank_name, branch_name, account_type, account_number, account_holder) 
VALUES (
    'id-001',
    'ブルームンウインクル　元アトリエ',
    'ブルームンウインクル　元アトリエ',
    '東京都港区芝5-10-4',
    '09014042509',
    'webbotanism@gmail.com',
    'https://example.com',
    '@bloom_winkle',
    'https://shop.example.com',
    '9:00-18:00',
    '美しい花とアレンジメントをお届けします',
    true,
    true,
    '三菱UFJ銀行',
    '自由が丘駅前支店',
    '普通',
    '1161872',
    'ブルームンウインクル 中三川聖次'
);

-- 6. テーブル構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;
