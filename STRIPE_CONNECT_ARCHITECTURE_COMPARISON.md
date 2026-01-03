# Stripe Connect アーキテクチャ比較

## 質問
「100店舗の登録店があった場合、100のStripeアカウントが必要なのか？運営のStripeアカウントと、顧客のクレジット番号で決済して、手数料を引いたものを各店舗の銀行口座に振り込めないのか？」

## 回答
はい、**運営側の1つのStripeアカウントで決済を受け取り、各店舗の銀行口座に振り込む方式**が可能です。これは**Stripe ConnectのDestination Chargesモード**を使用します。

---

## 方式の比較

### 方式1: 現在の実装（Direct Charges - 各店舗がStripeアカウントを持つ）

**仕組み:**
- 各店舗がStripe Connectアカウントを持つ
- 顧客の決済は各店舗のStripeアカウントに入る
- プラットフォーム手数料を引いて、残りを店舗に送金
- 店舗はStripe経由で銀行口座に引き出し

**メリット:**
- ✅ 店舗が自分のStripeダッシュボードで売上を確認できる
- ✅ 店舗が自分で引き出しタイミングを決められる
- ✅ 店舗の税務処理が明確（Stripeが発行する領収書）

**デメリット:**
- ❌ 各店舗がStripe Connectに登録する必要がある（オンボーディングが複雑）
- ❌ 100店舗なら100個のStripeアカウントが必要
- ❌ 店舗が登録しないと決済できない

**適用例:**
- 店舗が独立して事業を運営している場合
- 店舗が自分の売上を直接管理したい場合

---

### 方式2: Destination Charges（運営側が集約して振り込む）

**仕組み:**
- 運営側の1つのStripeアカウントで決済を受け取る
- プラットフォーム手数料を引く
- 残りを各店舗の銀行口座に振り込む（Stripe Transfer APIを使用）

**メリット:**
- ✅ 店舗がStripe Connectに登録する必要がない
- ✅ 運営側が1つのStripeアカウントで管理できる
- ✅ 店舗のオンボーディングが簡単（銀行口座情報だけ登録）
- ✅ 運営側が送金タイミングを制御できる

**デメリット:**
- ❌ 店舗がStripeダッシュボードで売上を確認できない
- ❌ 運営側が送金処理を実装する必要がある
- ❌ 送金タイミングの管理が必要

**適用例:**
- プラットフォーム型のサービス
- 店舗が小規模で、Stripe登録が難しい場合
- 運営側が送金を一元管理したい場合

---

### 方式3: 完全手動振り込み（Stripeを使わない）

**仕組み:**
- 運営側の1つのStripeアカウントで決済を受け取る
- プラットフォーム手数料を引く
- 運営側が手動で各店舗の銀行口座に振り込む（Stripe APIを使わない）

**メリット:**
- ✅ 店舗がStripe Connectに登録する必要がない
- ✅ 運営側が送金タイミングを完全に制御できる

**デメリット:**
- ❌ 送金処理を手動で実装する必要がある
- ❌ 送金履歴の管理が複雑
- ❌ 税務処理が複雑（運営側が送金証明を発行する必要がある）
- ❌ 自動化が難しい

**適用例:**
- 小規模なサービス
- 送金頻度が低い場合

---

## 推奨: Destination Charges方式

### 実装方法

#### 1. 決済処理の変更

```javascript
// api/create-payment-intent.js
// 変更前: 各店舗のStripeアカウントで決済
const session = await stripe.checkout.sessions.create({
  // ...
}, {
  stripeAccount: storeAccountId // 店舗のアカウント
});

// 変更後: 運営側のアカウントで決済
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [lineItem],
  mode: 'payment',
  // 店舗の銀行口座情報をメタデータに保存
  metadata: {
    store_id: storeId,
    store_bank_account: JSON.stringify(bankAccountInfo)
  }
  // stripeAccountは指定しない（運営側のアカウントで決済）
});
```

#### 2. 送金処理の実装

```javascript
// api/transfer-to-store.js（新規作成）
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { paymentIntentId, storeId } = req.body;

  // 1. Payment Intentから決済情報を取得
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  // 2. 店舗の銀行口座情報を取得
  const { data: storeData } = await supabase
    .from('stores')
    .select('bank_name, branch_name, account_number, account_holder')
    .eq('id', storeId)
    .single();

  // 3. 手数料を計算
  const totalAmount = paymentIntent.amount;
  const platformFee = Math.floor(totalAmount * 0.03); // 3%
  const storeAmount = totalAmount - platformFee;

  // 4. Stripe Transfer APIで店舗の銀行口座に送金
  const transfer = await stripe.transfers.create({
    amount: storeAmount,
    currency: 'jpy',
    destination: {
      // 店舗の銀行口座情報を使用
      bank_account: {
        country: 'JP',
        currency: 'jpy',
        account_holder_name: storeData.account_holder,
        account_holder_type: 'individual', // または 'company'
        routing_number: storeData.branch_name, // 支店番号
        account_number: storeData.account_number
      }
    },
    metadata: {
      store_id: storeId,
      payment_intent_id: paymentIntentId
    }
  });

  // 5. 送金履歴をデータベースに保存
  await supabase
    .from('payment_transactions')
    .insert({
      store_id: storeId,
      stripe_payment_intent_id: paymentIntentId,
      stripe_transfer_id: transfer.id,
      amount: totalAmount,
      platform_fee: platformFee,
      store_amount: storeAmount,
      status: 'succeeded'
    });

  res.status(200).json({ success: true, transfer });
}
```

#### 3. データベース設計の変更

```sql
-- storesテーブルからStripe Connect関連カラムを削除（オプション）
-- または、bank_account_infoのみを使用

-- 銀行口座情報は既に保存されている
-- bank_name, branch_name, account_number, account_holder
```

---

## 実装の変更点

### 必要な変更

1. **決済処理の変更**
   - `api/create-payment-intent.js`: `stripeAccount`を削除
   - 運営側のStripeアカウントで決済を受け取る

2. **送金処理の追加**
   - `api/transfer-to-store.js`: 新規作成
   - Webhookで決済成功時に自動送金

3. **店舗登録フローの簡素化**
   - Stripe Connect登録を削除
   - 銀行口座情報のみ登録

4. **データベース設計の変更**
   - `stripe_account_id`は不要（オプションで削除可能）
   - 銀行口座情報のみ使用

---

## 結論

**推奨: Destination Charges方式**

- ✅ 店舗のオンボーディングが簡単
- ✅ 運営側が1つのStripeアカウントで管理
- ✅ 送金処理を自動化できる
- ✅ 100店舗でも1つのStripeアカウントで対応可能

**実装の優先順位:**
1. 決済処理を運営側アカウントに変更
2. 送金処理を実装（Webhookで自動化）
3. 店舗登録フローを簡素化（銀行口座情報のみ）

