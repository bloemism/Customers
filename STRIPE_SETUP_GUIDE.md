# Stripe設定ガイド

## 1. Stripeダッシュボードでの商品作成

### テスト用商品の作成手順

1. **Stripeダッシュボードにログイン**
   - https://dashboard.stripe.com/test/products

2. **新しい商品を作成**
   - 「商品」→「商品を追加」
   - 商品名: `87app 月額プラン`
   - 説明: `87appの月額サブスクリプションプラン`

3. **価格を設定**
   - 価格タイプ: `定額制`
   - 価格: `5500` 円
   - 請求間隔: `月次`
   - 通貨: `JPY`

4. **商品IDを取得**
   - 作成後、商品の詳細ページで価格ID（price_xxx）をコピー
   - 例: `price_1Rp9I8QlIIKeUOm9jjn3oygt`

## 2. 環境変数の設定

### .env.localファイルを作成

```bash
# Stripe設定
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# その他の設定
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. コードの更新

### src/lib/stripe.ts の商品IDを更新

```typescript
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: {
    id: 'price_your_actual_price_id_here', // 実際のStripe価格ID
    stripePriceId: 'price_your_actual_price_id_here',
    name: '87app 月額プラン',
    price: 5500,
    // ... その他の設定
  }
};
```

## 4. テスト方法

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **サブスクリプション管理ページにアクセス**
   - http://localhost:5173/subscription-management

3. **「プランを開始」ボタンをクリック**
   - Stripe Checkoutページにリダイレクトされることを確認

4. **テスト用カード情報**
   - カード番号: `4242 4242 4242 4242`
   - 有効期限: 任意の将来の日付
   - CVC: 任意の3桁の数字

## 5. トラブルシューティング

### よくある問題

1. **「Stripeが初期化されていません」エラー**
   - 公開キーが正しく設定されているか確認
   - 環境変数ファイルが正しく読み込まれているか確認

2. **「商品が見つかりません」エラー**
   - 商品IDが正しく設定されているか確認
   - Stripeダッシュボードで商品が存在するか確認

3. **Checkoutページが表示されない**
   - ブラウザのコンソールでエラーログを確認
   - ネットワーク接続を確認

## 6. 本番環境での設定

本番環境では以下を変更してください：

1. **公開キーを本番用に変更**
   - `pk_test_` → `pk_live_`

2. **商品IDを本番用に変更**
   - テスト環境の商品ID → 本番環境の商品ID

3. **Webhookの設定**
   - 本番環境用のWebhookエンドポイントを設定
   - イベントハンドラーの実装
