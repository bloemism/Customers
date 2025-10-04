# Stripe Checkout統合ガイド

## 既存のStripe Checkout URL

### テスト用URL
```
https://buy.stripe.com/test_bJedRbbhY832ez8cGtgnK02
```

### 使用方法
1. **顧客が決済コードを入力** → `StorePayment.tsx`
2. **決済データを確認** → `StripeCheckout.tsx`
3. **Stripe決済ボタンをクリック** → 上記URLにリダイレクト
4. **決済完了** → 顧客に戻る

## 実装内容

### StripeCheckout.tsx の更新
- **直接Checkout URLにリダイレクト**
- **決済データをURLパラメータとして渡す**
- **カスタム情報の追加**

### URLパラメータ
```javascript
const checkoutUrl = new URL('https://buy.stripe.com/test_bJedRbbhY832ez8cGtgnK02');

// 顧客情報を事前入力
checkoutUrl.searchParams.set('prefilled_email', customerEmail);
checkoutUrl.searchParams.set('client_reference_id', paymentCode);

// カスタム情報
checkoutUrl.searchParams.set('customer_name', customerName);
checkoutUrl.searchParams.set('store_name', storeName);
checkoutUrl.searchParams.set('amount', finalAmount);
```

## 利点

### 1. シンプルな実装
- **複雑なAPI実装不要**
- **Stripe側で決済処理を完結**
- **セキュリティはStripeに委譲**

### 2. 顧客体験
- **標準的なStripe Checkout画面**
- **信頼性の高い決済フロー**
- **モバイル対応済み**

### 3. 管理の簡素化
- **Stripeダッシュボードで管理**
- **決済履歴の自動記録**
- **返金・キャンセル対応**

## 本番環境での使用

### 本番用URL作成
1. **Stripeダッシュボード**にログイン
2. **Payment Links** → **Create payment link**
3. **商品・価格を設定**
4. **本番用URLを取得**

### 環境変数設定
```bash
# 本番用Checkout URL
VITE_STRIPE_CHECKOUT_URL=https://buy.stripe.com/your_live_url_here

# テスト用Checkout URL
VITE_STRIPE_CHECKOUT_TEST_URL=https://buy.stripe.com/test_bJedRbbhY832ez8cGtgnK02
```

## 決済フロー

### 1. 店舗側
```
決済コード生成 → 顧客に伝達 → 決済確認
```

### 2. 顧客側
```
コード入力 → データ確認 → Stripe決済 → 完了
```

### 3. データ連携
```
ローカルストレージ → URLパラメータ → Stripe Checkout
```

## 注意事項

### セキュリティ
- **機密情報はURLパラメータに含めない**
- **決済金額はStripe側で管理**
- **顧客情報は必要最小限のみ**

### テスト
- **テスト用URLで動作確認**
- **実際の決済は少額でテスト**
- **決済完了後の処理を確認**

### 監視
- **Stripeダッシュボードで決済状況を確認**
- **エラーログの監視**
- **顧客からの問い合わせ対応**
