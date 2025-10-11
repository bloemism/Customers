# Stripe Connect 実装ガイド

## 実装完了機能

### ✅ 完了した機能

1. **データベース設計**
   - `stores`テーブルにStripe Connect関連カラムを追加
   - `payment_transactions`テーブルの作成（決済履歴管理）
   - `store_revenue_summary`テーブルの作成（日次売上サマリー）
   - 自動集計トリガーの実装

2. **APIエンドポイント**
   - `POST /api/create-connected-account` - Connected Account作成
   - `GET /api/get-connected-account?storeId=xxx` - アカウント情報取得
   - `POST /api/create-account-link` - オンボーディングリンク再生成

3. **Webhook処理**
   - `payment_intent.succeeded` - 決済成功時の処理
   - `payment_intent.payment_failed` - 決済失敗時の処理
   - `account.updated` - アカウント更新時の処理（新規追加）
   - `transfer.created` - 送金作成時の処理（強化）
   - `transfer.updated` - 送金更新時の処理（新規追加）

4. **フロントエンド画面**
   - `/stripe-connect-onboarding` - オンボーディング画面
   - `/stripe-connect-return` - オンボーディング完了画面
   - `/stripe-connect-refresh` - リフレッシュ画面
   - `/store-dashboard` - 店舗ダッシュボード（売上・決済履歴）

5. **サービス層**
   - `stripeConnectService.ts` - Stripe Connect関連のロジック
   - アカウント作成・取得・更新機能
   - トランザクション履歴取得
   - 売上統計取得
   - 手数料計算

### ❌ 実装しない機能

- **分割決済機能** - プラットフォーム手数料の自動分割は実装しません

---

## セットアップ手順

### 1. データベースのセットアップ

Supabase SQLエディタで以下のスクリプトを実行：

```bash
/Users/user/customers/supabase/stripe_connect_setup.sql
```

このスクリプトは以下を実行します：
- `stores`テーブルへのカラム追加
- `payment_transactions`テーブルの作成
- `store_revenue_summary`テーブルの作成
- RLSポリシーの設定
- 自動集計トリガーの作成
- 便利な関数とビューの作成

### 2. 環境変数の設定

`.env`ファイルに以下を追加（既存の場合は確認）：

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
NEXT_PUBLIC_BASE_URL=http://localhost:5174
```

### 3. Stripe Dashboardでの設定

#### 3.1 Connect設定を有効化
1. https://dashboard.stripe.com/connect/accounts/overview
2. 「Get started」をクリック
3. プラットフォーム情報を入力

#### 3.2 Webhook設定
1. https://dashboard.stripe.com/webhooks
2. 「Add endpoint」をクリック
3. エンドポイントURL: `https://your-domain.com/api/stripe-webhook`
4. 以下のイベントを選択：
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `transfer.created`
   - `transfer.updated`
5. Webhook署名シークレットを`.env`に追加

---

## 使い方

### 店舗側の流れ

#### 1. Stripe Connectアカウント作成

```typescript
// URL: /stripe-connect-onboarding?store_id=xxx

// 必要情報を入力：
// - メールアドレス
// - 事業者名
// - 事業形態（個人事業主 or 法人）
```

#### 2. オンボーディング完了

Stripeのオンボーディングページで以下を入力：
- 銀行口座情報
- 本人確認書類
- 事業情報

完了後、自動的に`/stripe-connect-return`にリダイレクト

#### 3. ダッシュボードで売上確認

```typescript
// URL: /store-dashboard?store_id=xxx

// 表示内容：
// - アカウント状態（決済受付、入金、詳細情報）
// - 期間選択（今日、7日間、30日間、全期間）
// - 売上統計（総売上、手数料、純売上、平均取引額）
// - 決済履歴一覧
```

### 顧客側の流れ（変更なし）

既存の決済フローはそのまま使用：
1. 決済コード入力（`/store-payment`）
2. 決済データ確認
3. Stripe決済（`/dynamic-stripe-checkout`）
4. 決済完了

---

## データベーステーブル

### stores（拡張）

| カラム名 | 型 | 説明 |
|---------|-----|------|
| stripe_account_id | VARCHAR(255) | Stripe Connected Account ID |
| stripe_account_status | VARCHAR(50) | アカウント状態（not_created, created, active） |
| stripe_account_type | VARCHAR(20) | アカウントタイプ（express） |
| stripe_charges_enabled | BOOLEAN | 決済受付可否 |
| stripe_payouts_enabled | BOOLEAN | 入金可否 |
| stripe_details_submitted | BOOLEAN | 詳細情報提出済み |
| stripe_onboarding_completed | BOOLEAN | オンボーディング完了 |
| bank_account_info | JSONB | 銀行口座情報（暗号化推奨） |
| stripe_updated_at | TIMESTAMP | Stripe情報更新日時 |

### payment_transactions（新規）

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | トランザクションID |
| store_id | TEXT | 店舗ID |
| customer_id | UUID | 顧客ID |
| payment_code | VARCHAR(5) | 決済コード |
| stripe_payment_intent_id | VARCHAR(255) | Stripe Payment Intent ID |
| stripe_transfer_id | VARCHAR(255) | Stripe Transfer ID |
| amount | INTEGER | 決済金額 |
| currency | VARCHAR(3) | 通貨（jpy） |
| platform_fee | INTEGER | プラットフォーム手数料 |
| stripe_fee | INTEGER | Stripe手数料 |
| store_amount | INTEGER | 店舗受取額 |
| status | VARCHAR(50) | 状態（pending, succeeded, failed） |
| payment_method | VARCHAR(50) | 決済方法（card） |
| metadata | JSONB | メタデータ |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### store_revenue_summary（新規）

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | サマリーID |
| store_id | TEXT | 店舗ID |
| date | DATE | 日付 |
| total_sales | INTEGER | 総売上 |
| total_transactions | INTEGER | 取引件数 |
| platform_fees | INTEGER | プラットフォーム手数料合計 |
| stripe_fees | INTEGER | Stripe手数料合計 |
| net_revenue | INTEGER | 純売上 |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

---

## API仕様

### POST /api/create-connected-account

Connected Accountを作成し、オンボーディングURLを返す。

**リクエスト:**
```json
{
  "storeId": "store-id-123",
  "email": "store@example.com",
  "businessName": "花屋 ブルーム",
  "businessType": "individual",
  "country": "JP",
  "currency": "jpy"
}
```

**レスポンス:**
```json
{
  "success": true,
  "accountId": "acct_xxx",
  "onboardingUrl": "https://connect.stripe.com/setup/xxx",
  "account": {
    "id": "acct_xxx",
    "charges_enabled": false,
    "payouts_enabled": false,
    "details_submitted": false
  }
}
```

### GET /api/get-connected-account?storeId=xxx

店舗のConnected Account情報を取得。

**レスポンス:**
```json
{
  "success": true,
  "hasAccount": true,
  "account": {
    "id": "acct_xxx",
    "charges_enabled": true,
    "payouts_enabled": true,
    "details_submitted": true,
    "email": "store@example.com",
    "business_profile": {
      "name": "花屋 ブルーム"
    }
  },
  "store": {
    "id": "store-id-123",
    "name": "花屋 ブルーム",
    "stripe_account_status": "active"
  }
}
```

### POST /api/create-account-link

オンボーディングリンクを再生成。

**リクエスト:**
```json
{
  "storeId": "store-id-123",
  "accountId": "acct_xxx"
}
```

**レスポンス:**
```json
{
  "success": true,
  "url": "https://connect.stripe.com/setup/xxx"
}
```

---

## トラブルシューティング

### アカウント作成エラー

**エラー:** "Connected Accountの作成に失敗しました"

**対処法:**
1. Stripe APIキーが正しいか確認
2. `STRIPE_SECRET_KEY`が設定されているか確認
3. Stripe Dashboardで Connect が有効になっているか確認

### オンボーディング未完了

**エラー:** "オンボーディングが完了していません"

**対処法:**
1. Stripeのオンボーディングページで全ての情報を入力
2. 本人確認書類をアップロード
3. 銀行口座情報を正しく入力
4. `/stripe-connect-onboarding?store_id=xxx`で状態を確認

### Webhook受信エラー

**エラー:** "Webhook signature verification failed"

**対処法:**
1. `STRIPE_WEBHOOK_SECRET`が正しいか確認
2. Stripe Dashboardで Webhook エンドポイントが正しく設定されているか確認
3. HTTPSを使用しているか確認（本番環境）

### ダッシュボードにデータが表示されない

**対処法:**
1. SQLスクリプト（`stripe_connect_setup.sql`）が正しく実行されたか確認
2. RLSポリシーが正しく設定されているか確認
3. トリガーが有効になっているか確認：
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_store_revenue_summary';
   ```

---

## セキュリティ考慮事項

### 1. APIキーの管理
- `.env`ファイルは`.gitignore`に追加
- 本番環境では環境変数を使用
- `STRIPE_SECRET_KEY`は絶対にクライアント側に公開しない

### 2. Webhook検証
- Webhook署名を必ず検証
- `stripe.webhooks.constructEvent()`を使用

### 3. データ暗号化
- 銀行口座情報は暗号化して保存（推奨）
- Supabaseの`pgcrypto`拡張を使用

### 4. RLSポリシー
- 店舗は自分のデータのみアクセス可能
- 顧客は自分の決済履歴のみアクセス可能

---

## 本番環境への移行

### 1. Stripe本番キーの設定

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
```

### 2. Webhook URLの更新

本番環境のURLを設定：
```
https://your-production-domain.com/api/stripe-webhook
```

### 3. Connect設定の確認

- ビジネス情報が正しく入力されているか
- プラットフォーム手数料率の確認
- 利用規約の承認

### 4. テスト

- テスト店舗でアカウント作成
- オンボーディング完了
- テスト決済の実行
- ダッシュボードでデータ確認

---

## サポート

### Stripe関連
- [Stripe Connect ドキュメント](https://stripe.com/docs/connect)
- [Stripe サポート](https://support.stripe.com/)

### Supabase関連
- [Supabase ドキュメント](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com/)

---

## 更新履歴

- **2025-10-11**: 初版作成
  - データベース設計
  - API実装
  - フロントエンド画面実装
  - Webhook強化
  - ダッシュボード実装
  - 分割決済機能は未実装（意図的）

