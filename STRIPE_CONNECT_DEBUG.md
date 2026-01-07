# Stripe Connect Direct Charges デバッグ情報

## 現在のエラー

```
Can only apply an application_fee_amount when the PaymentIntent is attempting a direct payment (using an OAuth key or Stripe-Account header) or destination payment (using `transfer_data[destination]`).
```

## 問題の原因

`stripeAccount`が正しく`Stripe-Account`ヘッダーとして送信されていない可能性があります。

## 確認事項

1. **連結アカウントID**: `acct_1Rp6qzQlIIKeUOm9`（Standardアカウント）
2. **Stripe SDKバージョン**: `17.7.0`
3. **実装方法**: Direct Chargesモデルで`stripeAccount`を第2引数に指定

## 解決策の検討

### オプション1: Stripe SDKの実装を確認
Stripe SDKが`stripeAccount`を正しく`Stripe-Account`ヘッダーとして送信しているか確認する必要があります。

### オプション2: 手動でヘッダーを設定
Stripe SDKの`_request`メソッドを使用して、手動で`Stripe-Account`ヘッダーを設定する方法を検討します。

### オプション3: Destination Chargesモデルに変更
Destination Chargesモデルを使用する場合、`transfer_data[destination]`を使用しますが、運営側のアカウントIDを指定することはできません。

### オプション4: Stripe Dashboardで確認
Stripe Dashboardで連結アカウント（`acct_1Rp6qzQlIIKeUOm9`）の状態を確認し、正しい設定方法を確認します。

## 次のステップ

1. Stripe Dashboardで連結アカウントの状態を確認
2. Stripe SDKの実装を確認し、正しい方法で`stripeAccount`を指定
3. 必要に応じて、手動で`Stripe-Account`ヘッダーを設定

