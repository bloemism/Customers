# 決済データ永続化テスト手順

## 実装完了日
2025年10月12日

## テスト目的
決済データがSupabaseに正しく保存され、ポイントが反映されることを確認する。

---

## テスト前の準備

### 1. Vercelのデプロイ確認
```
https://customers-three-rust.vercel.app/
```
最新のコミット（e68eedb）がデプロイされていることを確認。

### 2. Supabaseでテーブル確認
以下のテーブルが存在することを確認:
- `customers` (total_points カラムあり)
- `customer_payments`
- `point_history`

### 3. Stripe Webhookエンドポイント設定確認
Stripeダッシュボードで以下を確認:
- Webhook URL: `https://customers-three-rust.vercel.app/api/stripe-webhook`
- イベント: `payment_intent.succeeded`, `payment_intent.payment_failed`
- ステータス: Active

---

## テスト手順

### ステップ1: 顧客データ確認（テスト前）

**Supabase SQL Editor**で実行:
```sql
-- テスト顧客の現在のポイント確認
SELECT id, name, email, total_points, total_purchase_amount
FROM customers
WHERE email = 'テスト顧客のメールアドレス';
```

**結果を記録:**
- customer_id: _______________
- 現在のポイント: _______________

---

### ステップ2: 決済実行

1. **Customersアプリにログイン**
   - URL: https://customers-three-rust.vercel.app/customer-login
   - テスト顧客アカウントでログイン

2. **決済コード入力**
   - URL: https://customers-three-rust.vercel.app/store-payment
   - 決済コード: `DEMO1`（または店舗から提供されたコード）
   - 「決済する」ボタンをクリック

3. **Stripe Checkoutで決済**
   - テストカード番号: `4242 4242 4242 4242`
   - 有効期限: 任意の未来の日付（例: 12/34）
   - CVC: 任意の3桁（例: 123）
   - 「支払う」ボタンをクリック

4. **決済完了確認**
   - 「決済完了」画面が表示されることを確認

---

### ステップ3: データ確認（テスト後）

#### 3-1. 決済履歴確認

**Supabase SQL Editor**で実行:
```sql
-- 決済履歴確認
SELECT 
  id,
  customer_id,
  store_id,
  amount,
  points_earned,
  points_used,
  payment_method,
  status,
  payment_code,
  stripe_payment_intent_id,
  created_at
FROM customer_payments
ORDER BY created_at DESC
LIMIT 5;
```

**期待される結果:**
- ✅ 新しいレコードが作成されている
- ✅ `amount`が正しい金額（円単位）
- ✅ `points_earned`が金額の5%
- ✅ `status`が`completed`
- ✅ `payment_code`が正しい

---

#### 3-2. ポイント履歴確認

**Supabase SQL Editor**で実行:
```sql
-- ポイント履歴確認
SELECT 
  id,
  customer_id,
  points,
  reason,
  type,
  created_at
FROM point_history
ORDER BY created_at DESC
LIMIT 5;
```

**期待される結果:**
- ✅ 新しいレコードが作成されている
- ✅ `points`が金額の5%
- ✅ `type`が`earned`
- ✅ `reason`に店舗名が含まれている

---

#### 3-3. 顧客ポイント更新確認

**Supabase SQL Editor**で実行:
```sql
-- 顧客の更新されたポイント確認
SELECT id, name, email, total_points, total_purchase_amount, last_purchase_date
FROM customers
WHERE email = 'テスト顧客のメールアドレス';
```

**期待される結果:**
- ✅ `total_points`が増加している（テスト前 + points_earned）
- ✅ `total_purchase_amount`が増加している
- ✅ `last_purchase_date`が更新されている

---

#### 3-4. Customersアプリで確認

1. **決済履歴ページ**
   - URL: https://customers-three-rust.vercel.app/payment-history
   - ✅ 最新の決済が表示されている

2. **ポイント履歴ページ**
   - URL: https://customers-three-rust.vercel.app/point-history
   - ✅ 最新のポイント獲得が表示されている

3. **プロフィールページ**
   - URL: https://customers-three-rust.vercel.app/customer-profile
   - ✅ 総ポイントが更新されている

---

## トラブルシューティング

### 問題1: 決済履歴が保存されない

**確認ポイント:**
1. Vercelのログを確認（Webhook実行の有無）
   ```
   Vercel Dashboard > Customers > Functions > /api/stripe-webhook
   ```

2. StripeダッシュボードでWebhookログ確認
   ```
   Stripe Dashboard > Developers > Webhooks > エンドポイント選択 > Recent deliveries
   ```

3. Supabaseの環境変数確認
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

### 問題2: ポイントが反映されない

**確認ポイント:**
1. Webhookが正常に実行されているか
2. `customers.total_points`カラムが存在するか
3. RLSポリシーでINSERT/UPDATE権限があるか

**Supabase SQL Editorで実行:**
```sql
-- total_pointsカラム存在確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'total_points';
```

---

### 問題3: Webhook エラー

**Vercelログで確認するエラーメッセージ:**
- `customer_idがmetadataに含まれていません` → DynamicStripeCheckoutでmetadataが渡されていない
- `顧客データ取得エラー` → customer_idが間違っている
- `決済履歴記録エラー` → customer_paymentsテーブルのカラム不一致

---

## テスト結果記録

### 実行日時
_______________

### テスト実行者
_______________

### 結果

| チェック項目 | 結果 | 備考 |
|------------|------|------|
| 決済完了画面表示 | ⬜️ Pass / ⬜️ Fail | |
| customer_paymentsレコード作成 | ⬜️ Pass / ⬜️ Fail | |
| point_historyレコード作成 | ⬜️ Pass / ⬜️ Fail | |
| customers.total_points更新 | ⬜️ Pass / ⬜️ Fail | |
| customers.total_purchase_amount更新 | ⬜️ Pass / ⬜️ Fail | |
| Customersアプリで決済履歴表示 | ⬜️ Pass / ⬜️ Fail | |
| Customersアプリでポイント履歴表示 | ⬜️ Pass / ⬜️ Fail | |

### 総合結果
⬜️ Pass / ⬜️ Fail

### 備考・課題
_______________
_______________
_______________

---

## 次のステップ

### テスト成功の場合
1. ✅ 87appとの連携テスト
2. ✅ 本番環境移行準備

### テスト失敗の場合
1. エラーログを確認
2. 該当する修正を実施
3. 再度テスト実行

