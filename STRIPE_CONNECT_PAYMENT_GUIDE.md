# Stripe Connect Standard連結アカウント決済ページ 実装ガイド

## 概要

このドキュメントは、Stripe Connect Standard連結アカウントを使用した単独の決済ページの実装について説明します。

## 実装ファイル

### 1. APIエンドポイント
- **ファイル**: `api/create-connect-payment-intent.js`
- **エンドポイント**: `/api/create-connect-payment-intent`
- **メソッド**: `POST`
- **説明**: Stripe Connect Standard連結アカウント用の決済Intentを作成するAPI

### 2. フロントエンドページ
- **ファイル**: `src/pages/StripeConnectPayment.tsx`
- **ルート**: `/stripe-connect-payment`
- **説明**: 単独で動作するStripe Connect決済ページ

## 連結アカウント情報

- **連結アカウントID**: `acct_1SmWx4HPQsSTAKW2`
- **モデル**: Direct Charges（直接請求モデル）

## 資金と手数料の流れ

### 1. 顧客の決済
購入者がクレジットカード等で決済を行います。

### 2. 売上の計上
その決済は販売側（連結アカウント）のStripeアカウントの売上として計上されます。

### 3. 手数料の差し引き
その売上から、以下の2種類の手数料が自動的に差し引かれます：

- **Stripe決済手数料**: Stripeを利用するための基本手数料（例: 日本国内カードなら3.6% + 40円）
- **プラットフォーム手数料（Application Fee）**: 運営側が設定した独自の仲介手数料（デフォルト3%）

### 4. 振込
手数料が引かれた後の残りの金額が、販売側の銀行口座へStripeから直接振り込まれます。

## 運営側の収益

運営側には、上記ステップ3で差し引かれた「プラットフォーム手数料」のみが、運営側のStripeアカウント残高に積み上がります。

## APIリクエスト仕様

### リクエストボディ

```json
{
  "amount": 1000,                    // 決済金額（セント単位、必須）
  "currency": "jpy",                 // 通貨（デフォルト: jpy）
  "connected_account_id": "acct_1SmWx4HPQsSTAKW2",  // 連結アカウントID（必須）
  "application_fee_amount": 30,      // プラットフォーム手数料（セント単位、必須）
  "product_name": "花屋でのお買い物",  // 商品名
  "metadata": {                      // メタデータ（オプション）
    "payment_type": "stripe_connect_standard",
    "platform_fee_rate": "0.03"
  }
}
```

### レスポンス

#### 成功時（200 OK）

```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "payment_intent_id": "pi_...",
  "connected_account_id": "acct_1SmWx4HPQsSTAKW2",
  "application_fee_amount": 30,
  "amount": 1000
}
```

#### エラー時（400/500）

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "errorType": "StripeAPIError",
  "errorCode": "account_invalid",
  "details": "詳細なエラー情報"
}
```

## 使用方法

### 1. ローカル開発環境でのテスト

1. 開発サーバーを起動:
```bash
npm run dev
```

2. ブラウザで以下のURLにアクセス:
```
http://localhost:5173/stripe-connect-payment
```

3. 決済情報を入力:
   - 決済金額（円）
   - 商品名
   - プラットフォーム手数料率（%）

4. 「Stripe Connectで決済する」ボタンをクリック

5. Stripe Checkoutページで決済を完了

### 2. URLパラメータでの決済情報の指定

以下のようにURLパラメータで決済情報を指定できます:

```
/stripe-connect-payment?amount=5000&product_name=花束&fee_rate=0.05
```

- `amount`: 決済金額（円）
- `product_name`: 商品名
- `fee_rate`: プラットフォーム手数料率（0.0〜1.0）

### 3. 決済完了後の処理

決済が完了すると、以下のURLにリダイレクトされます:

```
/stripe-connect-payment-complete?session_id=cs_test_...
```

このページで決済完了メッセージと手数料計算結果が表示されます。

## 手数料計算例

### 例1: 1000円の決済、プラットフォーム手数料3%

- **決済金額**: ¥1,000
- **Stripe決済手数料**: ¥36 + ¥40 = ¥76（約3.6% + 40円）
- **プラットフォーム手数料**: ¥30（3%）
- **店舗への振込額**: ¥1,000 - ¥76 - ¥30 = ¥894
- **運営側の収益**: ¥30

### 例2: 5000円の決済、プラットフォーム手数料5%

- **決済金額**: ¥5,000
- **Stripe決済手数料**: ¥180 + ¥40 = ¥220（約3.6% + 40円）
- **プラットフォーム手数料**: ¥250（5%）
- **店舗への振込額**: ¥5,000 - ¥220 - ¥250 = ¥4,530
- **運営側の収益**: ¥250

## 環境変数

以下の環境変数が必要です:

- `STRIPE_SECRET_KEY`: Stripeのシークレットキー（必須）
- `VITE_API_BASE_URL`: APIのベースURL（オプション、空の場合は相対パスを使用）

## トラブルシューティング

### 1. 「STRIPE_SECRET_KEYが設定されていません」エラー

**原因**: 環境変数が設定されていない

**解決方法**:
- Vercel Dashboardで環境変数`STRIPE_SECRET_KEY`を設定
- ローカル開発環境の場合は`.env`ファイルに設定

### 2. 「Stripe Connect連結アカウントが無効です」エラー

**原因**: 連結アカウントIDが正しくない、または連結アカウントが有効化されていない

**解決方法**:
- Stripe Dashboardで連結アカウントの状態を確認
- 連結アカウントIDが正しいか確認（`acct_1SmWx4HPQsSTAKW2`）

### 3. CORSエラー

**原因**: APIエンドポイントのCORS設定が正しくない

**解決方法**:
- `api/create-connect-payment-intent.js`のCORSヘッダーを確認
- `vercel.json`のCORS設定を確認

### 4. 決済が完了しない

**原因**: Checkout Sessionの作成に失敗している

**解決方法**:
- Vercelのログを確認
- Stripe Dashboardでエラーを確認
- ネットワーク接続を確認

## 実装の特徴

1. **単独で動作**: この決済ページは単独で動作し、他のアプリケーションの機能に依存しません
2. **Direct Chargesモデル**: Stripe ConnectのDirect Chargesモデルを使用し、決済は連結アカウントの売上として計上されます
3. **自動手数料計算**: Stripe決済手数料とプラットフォーム手数料が自動的に計算され、表示されます
4. **柔軟な設定**: 決済金額、商品名、プラットフォーム手数料率を自由に設定できます
5. **エラーハンドリング**: 詳細なエラーメッセージとデバッグ情報を提供

## 次のステップ

1. 実際のStripe Connect連結アカウントでテスト
2. 決済完了後の処理を実装（データベースへの記録など）
3. Webhookの実装（決済完了通知など）
4. 他のアプリケーションへの統合

## 参考資料

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect Direct Charges](https://stripe.com/docs/connect/direct-charges)
- [Stripe Checkout Session API](https://stripe.com/docs/api/checkout/sessions)

