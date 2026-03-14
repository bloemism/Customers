# MCP・Supabase・Stripe 連携ガイド

2つ前のチャット（MCP / Supabase / Stripe 連携の話題）の内容を、プロジェクトの現状に基づいてまとめた参照用ドキュメントです。

---

## 1. MCP（Model Context Protocol）

### 有効な MCP サーバー（bloemtarot プロジェクト）

| サーバー | 識別子 | 用途 |
|----------|--------|------|
| **Supabase** | `project-0-bloemtarot-supabase` | データベース操作（SQL 実行、テーブル一覧、マイグレーション、プロジェクト管理など） |
| **Stripe** | `project-0-bloemtarot-stripe` | Stripe リソース取得（Customers, Payment Intents, Invoices, Products など） |
| **cursor-ide-browser** | `cursor-ide-browser` | ブラウザ操作（画面確認・E2E テスト用） |

### 配置場所

- 記述子・ツール定義:  
  `~/.cursor/projects/Users-user-bloemtarot/mcps/<server>/`
- Supabase の `project_id`: 利用するプロジェクトの ref（例: `aoqmdyapjsmmvjrwfdup` = 87app, `rynvfovkdcgsymvqqnle` = bloemism's Project）

### 利用例

- **Supabase**: `execute_sql`, `list_tables`, `list_projects` などで DB 確認・データ取得。
- **Stripe**: 決済・顧客・商品などの情報を MCP 経由で参照（本番の決済処理は API ルートで実行）。

---

## 2. Supabase

### 接続設定

- **フロント（ブラウザ）**: `src/lib/supabase.ts`
  - URL: `https://aoqmdyapjsmmvjrwfdup.supabase.co`（87app プロジェクト）
  - 認証: `createClient(supabaseUrl, supabaseAnonKey)`（anon key）
  - 認証オプション: PKCE, セッション永続化, URL 検出

- **API / Webhook（サーバー側）**: `api/stripe-webhook.js` など
  - 同じ Supabase URL
  - キー: `SUPABASE_SERVICE_ROLE_KEY`（サービスロール）で RLS を超えた書き込み

### 決済・ポイント・履歴で使っているテーブル

| テーブル | 用途 | 主な参照元 |
|----------|------|------------|
| `customers` | 顧客マスタ（user_id, points 等） | フロント: CustomerContext, CustomerAuthContext / Webhook: ポイント更新 |
| `purchase_history` | 購入履歴（customer_id, total_amount, points_earned/used） | 決済完了画面で INSERT / 顧客向け決済・ポイント履歴ページ |
| `purchase_items` | 購入明細 | 決済完了画面で INSERT |
| `payment_transactions` | Stripe Connect 決済トランザクション（store_id, stripe_payment_intent_id, amount, status） | 決済完了画面・Webhook・店舗向け一覧 |
| `customer_payments` | 顧客別決済履歴（決済日・金額・ポイント・ステータス） | Webhook で INSERT / 顧客向け決済履歴ページ（CustomerContext.getPaymentHistory） |
| `point_history` | ポイント付与・使用履歴（customer_id, points, type: earned/used） | Webhook で INSERT / 顧客向けポイント履歴（CustomerContext.getPointHistory） |

※ Webhook では `customers.total_points` / `total_purchase_amount` / `last_purchase_date` を更新しています。現在の `customers` スキーマが `points` のみの場合は、マイグレーションまたは Webhook 側のカラム名の合わせが必要です。

### 認証

- 顧客アプリ: Supabase Auth（メール/パスワード等）→ `auth.users`
- 顧客データ: `customers.user_id` で `auth.users.id` と紐付け
- RLS: 各テーブルで有効。サービスロールは Webhook などサーバー側のみで使用。

---

## 3. Stripe

### フロント（ブラウザ）

- **設定**: `src/lib/stripe.ts`
  - 公開キー: `VITE_STRIPE_PUBLISHABLE_KEY`（未設定時はフォールバックあり）
  - `loadStripe()` で Stripe.js を初期化
- **主な利用箇所**:
  - **Stripe Connect（店舗オンボーディング・決済）**: `src/services/stripeConnectService.ts`  
    - `createConnectedAccount`, `getConnectedAccount`, `createAccountLink`, `createPaymentIntent` など
  - **顧客決済**: `src/services/customerStripeService.ts`  
    - Payment Intent 作成・確認・ステータス取得
  - **決済完了後の DB 反映**: `src/pages/StripeConnectPaymentComplete.tsx`  
    - `purchase_history` / `purchase_items` / `payment_transactions` へ INSERT

### サーバー（API ルート）

- **配置**: `api/*.js`（Vercel のサーバーレス関数としてデプロイ）
- **環境変数**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **主なエンドポイント**:

| パス | 役割 |
|------|------|
| `POST /api/create-payment-intent` | 通常決済用 Payment Intent 作成（＋必要に応じて Supabase に payment_transactions の事前登録） |
| `POST /api/create-connect-payment-intent` | Connect 決済用 Payment Intent（application_fee 等） |
| `POST /api/create-connected-account` | Connect アカウント作成 |
| `GET /api/get-connected-account` | 店舗の Connect アカウント情報取得 |
| `POST /api/create-account-link` | オンボーディング用 Account Link 発行 |
| `GET /api/get-connected-account-status` | アカウント状態取得 |
| `GET /api/get-checkout-session` | Checkout Session 取得 |
| `GET /api/get-payment-intent` | Payment Intent 取得 |
| `GET /api/payment-status/:id` | 決済ステータス取得 |
| `POST /api/stripe-webhook` | Stripe Webhook 受信（下記） |

### Webhook（Stripe → Supabase）

- **ファイル**: `api/stripe-webhook.js`
- **検証**: `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`
- **処理例**:
  - `payment_intent.succeeded`  
    - Supabase: `customers` のポイント・購入額・最終購入日更新  
    - `customer_payments` に 1 件 INSERT  
    - `point_history` に付与・使用を INSERT  
    - 必要に応じて `payment_transactions` の更新・送金処理（`transfer-to-store.js`）
  - `payment_intent.payment_failed`: 失敗時のログ等
  - `account.updated` / `transfer.created` / `transfer.updated`: Connect アカウント・送金関連

---

## 4. 連携の流れ（まとめ）

```
[顧客アプリ]
  → Supabase (auth + customers, purchase_history, point_history, customer_payments 参照)
  → VITE_API_BASE_URL (Vercel) で /api/create-payment-intent 等を呼び出し
  → Stripe.js で決済 UI

[Vercel API]
  → STRIPE_SECRET_KEY で Payment Intent 作成など
  → 必要に応じて Supabase（サービスロール）で payment_transactions 等を書き込み

[Stripe Webhook]
  → payment_intent.succeeded 等
  → Supabase（サービスロール）で customers / customer_payments / point_history / payment_transactions を更新

[店舗・管理]
  → Supabase で payment_transactions / stores（Connect 情報）を参照
  → Stripe MCP で Stripe ダッシュボードと整合する情報を確認
```

---

## 5. 環境変数チェックリスト

| 変数 | 使う場所 | 備考 |
|------|-----------|------|
| `VITE_SUPABASE_URL` | フロント | 現在は supabase.ts にハードコードあり |
| `VITE_SUPABASE_ANON_KEY` | フロント | 同上 |
| `SUPABASE_SERVICE_ROLE_KEY` | API / Webhook のみ | 本番では必ず設定 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | フロント | Stripe.js 用 |
| `STRIPE_SECRET_KEY` | API / Webhook | sk_test_* または sk_live_* |
| `STRIPE_WEBHOOK_SECRET` | Webhook | whsec_* |
| `VITE_API_BASE_URL` | フロント | Vercel のデプロイ URL（localhost:5174 では API が無いため必須） |

---

## 6. 開発時の注意（localhost:5174）

- Vite 単体では `/api/*` は存在しないため、**Stripe や Connect の API を叩く場合は `VITE_API_BASE_URL` に Vercel の URL を設定**する（`DEV_API_SETUP.md` の通り）。
- Webhook は **Vercel の URL + /api/stripe-webhook** を Stripe ダッシュボードの Webhook エンドポイントに登録する。
- ローカルで Webhook を試す場合は **Stripe CLI の `stripe listen --forward-to localhost:3000/api/stripe-webhook`** 等でリレーする。

---

このドキュメントは、2つ前のチャットで話していた「MCP・Supabase・Stripe の連携」を、現在のリポジトリの実装に合わせて整理したものです。スキーマやエンドポイントが変わった場合は、このファイルを更新してください。
