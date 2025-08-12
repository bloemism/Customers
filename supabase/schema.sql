-- 87アプリ 花屋プラットフォーム データベーススキーマ
-- 店舗アプリ・顧客アプリ共通

-- ユーザー（店舗オーナー・顧客）テーブル
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  user_type TEXT DEFAULT 'customer', -- 'store_owner', 'customer'
  current_points INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 店舗テーブル
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  business_hours JSONB, -- {"monday": {"open": "09:00", "close": "18:00"}, ...}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 店舗画像テーブル
CREATE TABLE store_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品カテゴリテーブル
CREATE TABLE product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品テーブル
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- 円単位
  stock_quantity INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品画像テーブル
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 注文テーブル
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT,
  total_amount INTEGER NOT NULL, -- 円単位
  points_earned INTEGER DEFAULT 0,
  points_used INTEGER DEFAULT 0,
  payment_method TEXT DEFAULT 'card', -- 'card', 'cash'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  order_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled'
  qr_code_id TEXT, -- QRコードのID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 注文詳細テーブル
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL, -- 円単位
  total_price INTEGER NOT NULL, -- 円単位
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ポイント履歴テーブル
CREATE TABLE point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL, -- 正の値: 獲得, 負の値: 使用
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QRコードセッションテーブル（店舗アプリ用）
CREATE TABLE qr_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  total_amount INTEGER NOT NULL,
  items JSONB NOT NULL, -- 商品情報のJSON
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初期データ挿入
INSERT INTO product_categories (name, description) VALUES
('花束', '様々な花を組み合わせた花束'),
('鉢植え', '鉢に植えられた植物'),
('アレンジメント', '花器に生けた花のアレンジメント'),
('観葉植物', '室内で育てる観葉植物'),
('季節の花', '季節に応じた花'),
('ギフト', '贈り物用の花商品');

-- RLS (Row Level Security) の設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_sessions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- 店舗は誰でも閲覧可能、オーナーのみ編集可能
CREATE POLICY "Anyone can view active stores" ON stores FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage their stores" ON stores FOR ALL USING (auth.uid() = owner_id);

-- 商品は誰でも閲覧可能、店舗オーナーのみ編集可能
CREATE POLICY "Anyone can view available products" ON products FOR SELECT USING (is_available = true);
CREATE POLICY "Store owners can manage their products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid())
);

-- 注文はユーザーと店舗オーナーのみアクセス可能
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Store owners can view store orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid())
);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Store owners can update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid())
);

-- ポイント履歴はユーザーのみアクセス可能
CREATE POLICY "Users can view own point history" ON point_history FOR SELECT USING (auth.uid() = user_id);

-- QRセッションは店舗オーナーのみアクセス可能
CREATE POLICY "Store owners can manage QR sessions" ON qr_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = qr_sessions.store_id AND stores.owner_id = auth.uid())
);

-- 関数: 注文完了時にポイントを付与
CREATE OR REPLACE FUNCTION process_order_points()
RETURNS TRIGGER AS $$
BEGIN
  -- 決済が完了した場合のみポイントを付与
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    -- 注文金額の1%をポイントとして付与
    NEW.points_earned := FLOOR(NEW.total_amount * 0.01);
    
    -- ユーザーのポイントを更新
    UPDATE users 
    SET current_points = current_points + NEW.points_earned,
        total_points_earned = total_points_earned + NEW.points_earned,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- ポイント履歴に記録
    INSERT INTO point_history (user_id, order_id, points_change, description)
    VALUES (NEW.user_id, NEW.id, NEW.points_earned, '購入によるポイント獲得');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー: 注文更新時にポイント処理を実行
CREATE TRIGGER trigger_process_order_points
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION process_order_points();

-- 関数: QRセッションの有効期限チェック
CREATE OR REPLACE FUNCTION check_qr_session_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- 有効期限が切れたセッションを無効化
  UPDATE qr_sessions 
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at < NOW() AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー: QRセッションの有効期限チェック
CREATE TRIGGER trigger_check_qr_session_expiry
  AFTER INSERT OR UPDATE ON qr_sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_qr_session_expiry();

-- インデックスの作成
CREATE INDEX idx_stores_location ON stores(latitude, longitude);
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(payment_status);
CREATE INDEX idx_point_history_user ON point_history(user_id);
CREATE INDEX idx_qr_sessions_store ON qr_sessions(store_id);
CREATE INDEX idx_qr_sessions_status ON qr_sessions(status);
CREATE INDEX idx_qr_sessions_expires ON qr_sessions(expires_at);
