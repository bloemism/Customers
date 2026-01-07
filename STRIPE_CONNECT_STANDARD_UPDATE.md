# Stripe Connect Standardアカウント実装更新

## 更新内容

提供された情報を基に、Stripe Connect Standard連結アカウントの実装を更新しました。

## 主な変更点

### 1. アカウントタイプの変更

**変更前**: Expressアカウント
```javascript
type: 'express'
```

**変更後**: Standardアカウント
```javascript
type: 'standard'
```

### 2. Controller設定の追加

手数料と損失をapplication（運営側）が負担する設定を追加：

```javascript
controller: {
  fees: {
    payer: 'application', // 手数料をapplication（運営側）が負担
  },
  losses: {
    payments: 'application', // 返金などの損失をapplication（運営側）が負担
  },
  stripe_dashboard: {
    type: 'express', // Expressダッシュボードタイプ
  },
}
```

## リダイレクトURL

以下のリダイレクトURLが設定されています：

- **Return URL**: `https://customers-three-rust.vercel.app/stripe-connect-return`
- **Refresh URL**: `https://customers-three-rust.vercel.app/stripe-connect-refresh`

## 実装ファイル

### 1. APIエンドポイント

- **`api/create-connected-account.js`**: Standardアカウント作成
- **`api/create-account-link.js`**: オンボーディングリンク作成

### 2. フロントエンドページ

- **`src/pages/StripeConnectOnboarding.tsx`**: オンボーディングページ
- **`src/pages/StripeConnectReturn.tsx`**: オンボーディング完了後のリダイレクトページ
- **`src/pages/StripeConnectRefresh.tsx`**: オンボーディング再開ページ
- **`src/pages/StripeConnectPayment.tsx`**: 決済ページ

## Account Links APIの使用

オンボーディングリンクの作成例：

```javascript
const accountLink = await stripe.accountLinks.create({
  account: accountId,
  refresh_url: `${baseUrl}/stripe-connect-refresh?store_id=${storeId}`,
  return_url: `${baseUrl}/stripe-connect-return?store_id=${storeId}`,
  type: 'account_onboarding',
});
```

## Standardアカウントの特徴

1. **完全な機能**: Expressアカウントよりも多くの機能が利用可能
2. **手数料負担**: Controller設定により、手数料をapplication（運営側）が負担
3. **損失負担**: 返金などの損失もapplication（運営側）が負担
4. **Expressダッシュボード**: Expressタイプのダッシュボードを使用可能

## 手数料と損失の負担

### Application（運営側）が負担するもの

- **Stripe決済手数料**: カード決済の手数料
- **プラットフォーム手数料**: Application Feeとして設定した手数料
- **返金などの損失**: 決済に関する損失

### 連結アカウント（店舗側）が受け取るもの

- **決済金額から手数料を差し引いた残額**: 自動的に銀行口座へ振り込まれる

## オンボーディングフロー

1. **アカウント作成**: `/api/create-connected-account`でStandardアカウントを作成
2. **オンボーディングリンク生成**: Account Links APIでオンボーディングURLを生成
3. **オンボーディング**: 店舗がStripeのオンボーディングページで情報を入力
4. **リダイレクト**: 完了後、`/stripe-connect-return`にリダイレクト
5. **確認**: アカウントの状態を確認し、完了を通知

## 決済フロー

1. **決済Intent作成**: `/api/create-connect-payment-intent`で決済Intentを作成
2. **Checkout Session**: Stripe Checkout Sessionを作成（連結アカウント経由）
3. **決済**: 顧客がStripe Checkoutページで決済
4. **手数料計算**: Application Feeが自動的に計算される
5. **振込**: 残額が店舗の銀行口座へ自動振込

## 環境変数

以下の環境変数が必要です：

- `STRIPE_SECRET_KEY`: Stripeのシークレットキー（必須）
- `VITE_SUPABASE_URL`: SupabaseのURL（オプション）
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのサービスロールキー（オプション）

## ベースURLの設定

ベースURLは以下の優先順位で決定されます：

1. `NEXT_PUBLIC_BASE_URL`環境変数
2. `VITE_BASE_URL`環境変数
3. `VERCEL_URL`環境変数（自動検出）
4. `req.headers.host`（自動検出）
5. デフォルト値: `https://customers-three-rust.vercel.app`

## トラブルシューティング

### 1. オンボーディングが完了しない

**原因**: 必要な情報が入力されていない

**解決方法**:
- Stripe Dashboardでアカウントの状態を確認
- `requirements.currently_due`を確認し、必要な情報を入力

### 2. 決済が失敗する

**原因**: アカウントが有効化されていない

**解決方法**:
- `charges_enabled`が`true`になっているか確認
- `details_submitted`が`true`になっているか確認

### 3. 手数料が正しく計算されない

**原因**: Controller設定が正しくない

**解決方法**:
- アカウント作成時のController設定を確認
- Application Feeの計算ロジックを確認

## 参考資料

- [Stripe Connect Standard Accounts](https://stripe.com/docs/connect/standard-accounts)
- [Stripe Connect Controller](https://stripe.com/docs/connect/controller)
- [Stripe Account Links API](https://stripe.com/docs/api/account_links)

