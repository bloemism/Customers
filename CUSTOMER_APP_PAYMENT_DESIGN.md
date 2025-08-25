# 顧客アプリ決済システム設計概要

## ビジネスモデル

### 店舗側（87app）
- **定額会費**: ¥5,500/月（税込）
- **機能**: 全機能利用可能
- **収益源**: 顧客決済時の手数料3%

### 顧客アプリ側
- **手数料**: 3%
- **決済時**: 店舗に手数料が入金
- **例**: ¥1,000の商品 → 顧客支払額 ¥1,030（手数料¥30）

## 顧客アプリ決済フロー

### 1. 商品選択・カート
```
商品価格: ¥1,000
手数料 (3%): ¥30
顧客支払額: ¥1,030
```

### 2. 決済処理
1. **顧客**: 商品選択・カート追加
2. **手数料計算**: 自動で3%追加
3. **決済**: Stripe決済
4. **店舗収益**: 元の商品価格（手数料除く）
5. **手数料収益**: 3%分が87appに

### 3. データ構造

#### 決済データ
```json
{
  "store_id": "store_123",
  "customer_id": "customer_456",
  "items": [
    {
      "product_id": "product_789",
      "name": "バラの花束",
      "quantity": 1,
      "unit_price": 1000,
      "total_price": 1000
    }
  ],
  "subtotal": 1000,
  "payment_fee": 30,
  "customer_total": 1030,
  "store_revenue": 1000,
  "payment_method": "credit_card",
  "status": "completed",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 技術実装

### 1. 手数料計算サービス
```typescript
// 顧客アプリ側
class CustomerPaymentService {
  static calculatePaymentFee(amount: number) {
    const feePercentage = 3; // 3%
    const feeAmount = Math.round(amount * (feePercentage / 100));
    const totalAmount = amount + feeAmount;
    
    return {
      originalAmount: amount,
      feeAmount: feeAmount,
      totalAmount: totalAmount,
      storeRevenue: amount
    };
  }
}
```

### 2. Stripe決済設定
```typescript
// 顧客アプリ側のStripe設定
const stripeConfig = {
  publishableKey: 'pk_test_...',
  // 手数料設定
  applicationFeeAmount: 30, // 3%分の手数料
  transferData: {
    destination: 'store_stripe_account_id', // 店舗のStripeアカウント
  }
};
```

### 3. 店舗収益管理
```typescript
// 店舗側の収益管理
interface StoreRevenue {
  store_id: string;
  total_revenue: number;
  fee_revenue: number;
  net_revenue: number;
  transaction_count: number;
  period: 'daily' | 'weekly' | 'monthly';
}
```

## データベース設計

### 顧客決済テーブル
```sql
CREATE TABLE customer_payments (
  id UUID PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  customer_id VARCHAR(255) NOT NULL,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  subtotal INTEGER NOT NULL,
  payment_fee INTEGER NOT NULL,
  customer_total INTEGER NOT NULL,
  store_revenue INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 店舗収益テーブル
```sql
CREATE TABLE store_revenues (
  id UUID PRIMARY KEY,
  store_id VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue INTEGER NOT NULL,
  fee_revenue INTEGER NOT NULL,
  net_revenue INTEGER NOT NULL,
  transaction_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 顧客アプリ機能

### 1. 商品カタログ
- 店舗の商品一覧表示
- 商品詳細・価格表示
- カート機能

### 2. 決済機能
- 手数料込み価格表示
- Stripe決済
- 決済履歴

### 3. 店舗検索
- 地図表示
- 店舗情報
- レビュー・評価

### 4. ポイントシステム
- 購入時のポイント付与
- ポイント使用
- ポイント履歴

## 店舗側の収益管理

### 1. 収益ダッシュボード
- 日次・週次・月次収益
- 手数料収益の詳細
- 取引履歴

### 2. レポート機能
- 売上レポート
- 顧客分析
- 商品分析

### 3. 手数料管理
- 手数料率の確認
- 手数料収益の確認
- 支払い履歴

## セキュリティ考慮事項

### 1. 決済セキュリティ
- StripeのPCI DSS準拠
- トークン化決済
- 不正利用検知

### 2. データ保護
- 顧客情報の暗号化
- 決済データの保護
- アクセス制御

### 3. 監査ログ
- 決済ログ
- アクセスログ
- エラーログ

## 今後の拡張

### 1. 機能拡張
- 複数通貨対応
- 国際決済
- サブスクリプション決済

### 2. 分析機能
- AI分析
- 予測分析
- 顧客行動分析

### 3. 統合機能
- 会計システム連携
- 在庫管理連携
- CRM連携
