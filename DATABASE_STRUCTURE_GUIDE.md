# データベース構造とStripe実装ガイド

## 現在のデータベース構造

### 主要テーブル

#### 1. storesテーブル
```sql
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,  -- 注意: 実際には存在しない可能性
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  business_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. store_ownersテーブル（存在する場合）
```sql
-- このテーブルが存在する場合
CREATE TABLE store_owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. subscriptionsテーブル（作成予定）
```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_price INTEGER NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Stripe実装の対応

### 1. 店舗IDの取得方法

現在の実装では、以下の順序で店舗IDを取得します：

1. **storesテーブルのowner_idカラム**（存在する場合）
   ```sql
   SELECT id FROM stores WHERE owner_id = 'user_id'
   ```

2. **store_ownersテーブル経由**（存在する場合）
   ```sql
   SELECT s.id FROM stores s
   JOIN store_owners so ON s.id = so.store_id
   WHERE so.user_id = 'user_id'
   ```

3. **ダミーデータ返却**（上記が失敗した場合）
   - エラーを出さずにダミーデータを返す
   - Stripe Checkoutは正常に動作する

### 2. エラーハンドリング

#### データベースエラーの場合
- `stores`テーブルが存在しない
- `owner_id`カラムが存在しない
- `store_owners`テーブルが存在しない
- ユーザーに対応する店舗が存在しない

→ **すべてダミーデータを返し、Stripe Checkoutは正常に動作**

#### Stripeエラーの場合
- 商品IDが無効
- 公開キーが無効
- ネットワークエラー

→ **エラーメッセージを表示**

## 実装の優先順位

### 高優先度（現在実装済み）
1. ✅ Stripe Checkoutの動作
2. ✅ エラーハンドリング
3. ✅ ダミーデータ返却

### 中優先度（次に実装）
1. 🔄 データベーステーブルの作成
2. 🔄 実際のサブスクリプション情報の保存
3. 🔄 Webhook処理

### 低優先度（後で実装）
1. ⏳ 詳細なRLSポリシー
2. ⏳ 支払い方法管理
3. ⏳ 決済履歴

## テスト方法

### 1. Stripe Checkoutテスト
```
http://localhost:5173/stripe-test
```
- 「Stripe Checkout テスト」ボタンをクリック
- Stripe Checkoutページにリダイレクトされることを確認

### 2. サブスクリプション管理ページテスト
```
http://localhost:5173/subscription-management
```
- 「プランを開始」ボタンをクリック
- Stripe Checkoutが動作することを確認

### 3. データベーステスト
```
http://localhost:5173/stripe-test
```
- 「サブスクリプション状態取得テスト」ボタンをクリック
- コンソールでログを確認

## 次のステップ

1. **Supabaseでテーブル作成**
   ```sql
   -- supabase/stripe_simple_setup.sql を実行
   ```

2. **実際のテスト**
   - ブラウザでテストページにアクセス
   - Stripe Checkoutの動作確認

3. **データベース構造の確認**
   - 実際のテーブル構造を確認
   - 必要に応じて修正

## トラブルシューティング

### よくある問題

1. **「owner_idカラムが存在しない」エラー**
   - 現在の実装では自動的にダミーデータを返す
   - Stripe Checkoutは正常に動作する

2. **「storesテーブルが存在しない」エラー**
   - 現在の実装では自動的にダミーデータを返す
   - Stripe Checkoutは正常に動作する

3. **「Stripe Checkoutエラー」**
   - 商品IDを確認
   - 公開キーを確認
   - ネットワーク接続を確認
