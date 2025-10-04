# Stripe Connect 設定ガイド

## 概要
Stripe Connectを使用して、店舗（Connected Account）と顧客間の決済を処理し、手数料を自動分割する機能を実装します。

## 1. Stripe Connect アカウント設定

### 1.1 プラットフォームアカウントの作成
1. **Stripeダッシュボードにログイン**
   - https://dashboard.stripe.com/connect/accounts/overview

2. **Connect設定を有効化**
   - 左メニューから「Connect」を選択
   - 「アカウントを作成」をクリック
   - プラットフォームタイプを選択（Standard または Express）

3. **プラットフォーム情報を入力**
   - プラットフォーム名: `Bloemism 87app`
   - 説明: `花屋・フラワースクール向け決済プラットフォーム`
   - ウェブサイト: アプリのURL

### 1.2 環境変数の設定
```bash
# .env ファイルに追加
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id_here
```

## 2. Connected Account の作成

### 2.1 店舗アカウント作成用API
```typescript
// 店舗用Connected Account作成
export const createConnectedAccount = async (storeData: {
  email: string;
  businessName: string;
  businessType: 'individual' | 'company';
  country: string;
  currency: string;
}) => {
  const response = await fetch('/api/create-connected-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
    },
    body: JSON.stringify(storeData)
  });
  
  return response.json();
};
```

### 2.2 店舗登録フロー
1. **店舗情報入力**
   - 店舗名、住所、電話番号
   - 事業者登録番号
   - 銀行口座情報

2. **Connected Account作成**
   - Stripe APIでアカウント作成
   - アカウントIDをデータベースに保存

3. **本人確認**
   - 必要書類のアップロード
   - 審査完了まで待機

## 3. 決済処理の実装

### 3.1 分割決済の設定
```typescript
// 決済時の手数料分割
export const createPaymentWithConnect = async (
  amount: number,
  storeAccountId: string,
  applicationFeeAmount: number
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // 円をセントに変換
    currency: 'jpy',
    application_fee_amount: applicationFeeAmount * 100,
    transfer_data: {
      destination: storeAccountId,
    },
    metadata: {
      store_id: storeAccountId,
      platform: 'bloemism-87app'
    }
  });
  
  return paymentIntent;
};
```

### 3.2 手数料計算
```typescript
// 手数料計算ロジック
export const calculateFees = (amount: number) => {
  const platformFeeRate = 0.03; // 3%
  const stripeFeeRate = 0.036; // 3.6% + 固定費
  
  const platformFee = Math.round(amount * platformFeeRate);
  const stripeFee = Math.round(amount * stripeFeeRate) + 40; // 40円固定費
  const storeAmount = amount - platformFee - stripeFee;
  
  return {
    total: amount,
    platformFee,
    stripeFee,
    storeAmount,
    applicationFee: platformFee
  };
};
```

## 4. データベース設計

### 4.1 店舗テーブルの拡張
```sql
-- storesテーブルにStripe Connect情報を追加
ALTER TABLE stores ADD COLUMN stripe_account_id VARCHAR(255);
ALTER TABLE stores ADD COLUMN stripe_account_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE stores ADD COLUMN stripe_account_verified BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN bank_account_info JSONB;
```

### 4.2 決済履歴テーブル
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  customer_id UUID REFERENCES customers(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  store_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 5. Webhook設定

### 5.1 必要なイベント
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated`
- `transfer.created`

### 5.2 Webhookエンドポイント
```typescript
// /api/stripe-webhook
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'account.updated':
      await handleAccountUpdate(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({received: true});
};
```

## 6. 店舗向けダッシュボード

### 6.1 売上管理画面
- 日別・月別売上表示
- 手数料内訳
- 入金予定日
- 決済履歴

### 6.2 アカウント管理
- Stripe Connect アカウント状況
- 銀行口座情報
- 本人確認状況
- 入金設定

## 7. セキュリティ考慮事項

### 7.1 データ保護
- 機密情報の暗号化
- PCI DSS準拠
- アクセス制御

### 7.2 監査ログ
- 全決済の記録
- エラーログ
- 不正検知

## 8. テスト方法

### 8.1 テスト用Connected Account
```typescript
// テスト用アカウント作成
const testAccount = await stripe.accounts.create({
  type: 'express',
  country: 'JP',
  email: 'test@example.com',
  capabilities: {
    card_payments: {requested: true},
    transfers: {requested: true},
  },
});
```

### 8.2 テスト決済
- テスト用カード: `4242 4242 4242 4242`
- 小額での決済テスト
- 手数料計算の確認

## 9. 本番環境での注意点

### 9.1 審査プロセス
- 店舗の本人確認
- 事業内容の審査
- リスク評価

### 9.2 コンプライアンス
- 金融商品取引法
- 個人情報保護法
- 税務処理

## 10. トラブルシューティング

### 10.1 よくある問題
- アカウント作成失敗
- 決済処理エラー
- 手数料計算ミス

### 10.2 サポート
- Stripeサポート
- 開発者ドキュメント
- コミュニティフォーラム

