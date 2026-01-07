# Stripe Connect決済ページ テストガイド

## テスト方法

### 1. 開発サーバーの起動

```bash
npm run dev
```

### 2. テストページへのアクセス

ブラウザで以下のURLにアクセス：

```
http://localhost:5173/stripe-connect-payment
```

### 3. テスト用パラメータ付きURL

以下のようにURLパラメータで決済情報を指定できます：

```
http://localhost:5173/stripe-connect-payment?amount=5000&product_name=花束&fee_rate=0.05
```

- `amount`: 決済金額（円）
- `product_name`: 商品名
- `fee_rate`: プラットフォーム手数料率（0.0〜1.0）

## 必要な環境変数

### ローカル開発環境（.envファイル）

以下の環境変数を設定してください：

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
VITE_API_BASE_URL=http://localhost:5173
```

### Vercel環境変数

Vercel Dashboardで以下の環境変数を設定：

- `STRIPE_SECRET_KEY`: Stripeのシークレットキー（必須）
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripeの公開キー（フロントエンド用、オプション）
- `VITE_API_BASE_URL`: APIのベースURL（空の場合は相対パスを使用）

## テスト手順

### 1. 基本テスト

1. 開発サーバーを起動
2. `http://localhost:5173/stripe-connect-payment`にアクセス
3. 決済金額を入力（例: 1000円）
4. 商品名を入力（例: 花束）
5. プラットフォーム手数料率を設定（例: 3%）
6. 「Stripe Connectで決済する」ボタンをクリック
7. Stripe Checkoutページでテスト決済を実行

### 2. テストカード番号

Stripeのテストモードでは、以下のカード番号が使用できます：

- **成功**: `4242 4242 4242 4242`
- **3Dセキュア認証**: `4000 0025 0000 3155`
- **失敗**: `4000 0000 0000 0002`

有効期限: 任意の未来の日付（例: 12/34）
CVC: 任意の3桁（例: 123）

### 3. 連結アカウントID

現在の実装では、以下の連結アカウントIDが使用されています：

```
acct_1SmWx4HPQsSTAKW2
```

このIDは`src/pages/StripeConnectPayment.tsx`で設定されています。

## トラブルシューティング

### 1. 「STRIPE_SECRET_KEYが設定されていません」エラー

**原因**: 環境変数が設定されていない

**解決方法**:
- `.env`ファイルに`STRIPE_SECRET_KEY`を設定
- Vercel環境の場合は、Vercel Dashboardで環境変数を設定

### 2. CORSエラー

**原因**: APIエンドポイントのCORS設定が正しくない

**解決方法**:
- `api/create-connect-payment-intent.js`のCORSヘッダーを確認
- `vercel.json`のCORS設定を確認

### 3. 決済が完了しない

**原因**: Checkout Sessionの作成に失敗している

**解決方法**:
- ブラウザのコンソールでエラーを確認
- Vercelのログを確認
- Stripe Dashboardでエラーを確認

### 4. 連結アカウントが無効

**原因**: 連結アカウントIDが正しくない、またはアカウントが有効化されていない

**解決方法**:
- Stripe Dashboardで連結アカウントの状態を確認
- 連結アカウントIDが正しいか確認
- アカウントが有効化されているか確認（`charges_enabled: true`）

## テストチェックリスト

- [ ] 開発サーバーが起動している
- [ ] 環境変数が設定されている
- [ ] 決済ページが表示される
- [ ] 決済金額を入力できる
- [ ] 商品名を入力できる
- [ ] プラットフォーム手数料率を設定できる
- [ ] 手数料計算結果が表示される
- [ ] 「Stripe Connectで決済する」ボタンが動作する
- [ ] Stripe Checkoutページにリダイレクトされる
- [ ] テストカードで決済が完了する
- [ ] 決済完了ページが表示される

## デバッグ情報

### ブラウザコンソール

決済処理中に以下のログが出力されます：

```javascript
// 決済開始時
Stripe Connect決済開始: {
  amount: 1000,
  connected_account_id: "acct_1SmWx4HPQsSTAKW2",
  application_fee_amount: 30,
  product_name: "花屋でのお買い物"
}

// API成功時
Stripe Connect決済Intent作成成功: {
  success: true,
  sessionId: "cs_test_...",
  url: "https://checkout.stripe.com/...",
  ...
}
```

### Vercelログ

Vercel Dashboardで以下のログを確認できます：

```
リクエストボディ: {...}
Stripe Connect決済Intent作成開始（Direct Chargesモデル）: {...}
Checkout Session作成開始（Stripe Connect）: {...}
Checkout Session作成成功（Stripe Connect）: {...}
```

## 次のステップ

1. 実際のStripe Connect連結アカウントでテスト
2. 決済完了後の処理を実装（データベースへの記録など）
3. Webhookの実装（決済完了通知など）
4. エラーハンドリングの改善

