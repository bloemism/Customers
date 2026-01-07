# Stripe Connect 決済エラー解決方法

## 現在のエラー

```
Can only apply an application_fee_amount when the PaymentIntent is attempting a direct payment (using an OAuth key or Stripe-Account header) or destination payment (using `transfer_data[destination]`).
```

## 問題の原因

1. **連結アカウントに制限がかかっている**: 3つとも制限がかかっているとのこと
2. **`stripeAccount`が正しく送信されていない**: Stripe-Accountヘッダーが設定されていない
3. **StandardアカウントでDirect Chargesの制限**: 制限がある場合、Direct Chargesは使用できない

## 解決策

### 1. 連結アカウントの制限を解除（推奨）

Stripe Dashboardで連結アカウント（`acct_1Rp6qzQlIIKeUOm9`）の制限を解除してください：

1. Stripe Dashboardにログイン
2. Connect > Accounts に移動
3. 連結アカウント（`acct_1Rp6qzQlIIKeUOm9`）を選択
4. 制限の詳細を確認
5. 必要な情報を提供して制限を解除

### 2. 制限解除後の確認

制限解除後、以下の点を確認してください：

- `charges_enabled`: `true`であること
- `payouts_enabled`: `true`であること
- `details_submitted`: `true`であること
- `restrictions`: 空であること

### 3. 実装の確認

現在の実装では、連結アカウントの状態を確認するコードを追加しています：

- 制限チェック
- 決済有効性チェック
- 詳細なエラーメッセージ

## 次のステップ

1. **Stripe Dashboardで制限を解除**
2. **制限解除後、再度決済を試す**
3. **エラーが続く場合、Stripeサポートに問い合わせ**

## 注意事項

- Standardアカウントは動作している（ペイメントリンクで実績あり）
- 制限を解除すれば、Connectも使用できるはずです
- 店舗IDと顧客IDは必須ではありませんが、メタデータとして含めることができます

