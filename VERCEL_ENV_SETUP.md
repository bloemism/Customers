# Vercel環境変数設定ガイド

## 問題

デプロイされたアプリで500エラーが発生しています。
原因: APIエンドポイント（サーバーレス関数）に必要な環境変数が設定されていません。

## 必要な環境変数

### フロントエンド用（VITE_で始まる）
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`（テスト: pk_test_xxx, 本番: pk_live_xxx）

### API用（サーバーレス関数で使用）
- `STRIPE_SECRET_KEY`（テスト: sk_test_xxx, 本番: sk_live_xxx）
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_WEBHOOK_SECRET`（whsec_xxx）
- `VITE_SUPABASE_URL`（APIからも参照される）

---

## 設定方法

### オプション1: Vercel Dashboard（推奨）

1. **Vercelダッシュボードにアクセス**
   https://vercel.com/bloemisms-projects/customers/settings/environment-variables

2. **環境変数を追加**
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://aoqmdyapjsmmvjrwfdup.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
   | `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSyDcJkaHDTPcgBSfr2923T6K6YT_kiL3s4g` | Production, Preview, Development |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_xxx`（または`pk_live_xxx`） | Production |
   | `STRIPE_SECRET_KEY` | `sk_test_xxx`（または`sk_live_xxx`） | Production |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` | Production |

3. **再デプロイ**
   環境変数を追加後、再デプロイが必要です：
   ```bash
   cd /Users/user/customers
   vercel --prod
   ```

---

### オプション2: Vercel CLI

一括で環境変数を設定するスクリプト：

```bash
#!/bin/bash
cd /Users/user/customers

# フロントエンド用環境変数
vercel env add VITE_SUPABASE_URL production << EOF
https://aoqmdyapjsmmvjrwfdup.supabase.co
EOF

vercel env add VITE_SUPABASE_ANON_KEY production << EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTY2NTAsImV4cCI6MjA3MDU3MjY1MH0.jPQ4jGvuLDDZ4sFU1sbakWJIRyBKbEkaXsTnirQR4PY
EOF

vercel env add VITE_GOOGLE_MAPS_API_KEY production << EOF
AIzaSyDcJkaHDTPcgBSfr2923T6K6YT_kiL3s4g
EOF

vercel env add VITE_STRIPE_PUBLISHABLE_KEY production << EOF
YOUR_STRIPE_PUBLISHABLE_KEY_HERE
EOF

# API用環境変数
vercel env add STRIPE_SECRET_KEY production << EOF
YOUR_STRIPE_SECRET_KEY_HERE
EOF

vercel env add SUPABASE_SERVICE_ROLE_KEY production << EOF
YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE
EOF

vercel env add STRIPE_WEBHOOK_SECRET production << EOF
YOUR_STRIPE_WEBHOOK_SECRET_HERE
EOF

# 再デプロイ
vercel --prod
```

---

## 現在のStripeキー

### ⚠️ 重要: Stripeキーを設定してください

現在、`.env`ファイルには以下のプレースホルダーが設定されています：
```
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

**必要なStripeキー:**

#### テスト環境（推奨）
1. Stripeダッシュボード: https://dashboard.stripe.com/test/apikeys
2. 以下のキーをコピー：
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

#### 本番環境
1. Stripeダッシュボード: https://dashboard.stripe.com/apikeys
2. 以下のキーをコピー：
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

---

## Supabase Service Role Key

Supabaseダッシュボードから取得：
1. https://supabase.com/dashboard/project/aoqmdyapjsmmvjrwfdup/settings/api
2. 「Service Role Key」セクション
3. 「Reveal」をクリックしてキーをコピー

---

## Stripe Webhook Secret

Stripe Webhook Secretを取得：
1. https://dashboard.stripe.com/webhooks
2. エンドポイントを選択
3. 「Signing secret」をコピー

**エンドポイントURL:**
```
https://customers-three-rust.vercel.app/api/stripe-webhook
```

**イベント:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated`
- `transfer.created`
- `transfer.updated`

---

## 設定確認

環境変数が正しく設定されているか確認：

```bash
vercel env ls
```

---

## トラブルシューティング

### エラー: 500 Internal Server Error

**原因:**
- `STRIPE_SECRET_KEY`が設定されていない
- `SUPABASE_SERVICE_ROLE_KEY`が設定されていない

**対処法:**
1. Vercel Dashboardで環境変数を確認
2. 不足している環境変数を追加
3. 再デプロイ

### エラー: Cannot read property 'create' of undefined

**原因:**
- Stripe初期化エラー（APIキーが無効）

**対処法:**
1. Stripeキーが正しいか確認
2. テストモードと本番モードが一致しているか確認

---

## 推奨設定

### 開発環境
- テストモードのStripeキーを使用
- `VITE_API_BASE_URL`はVercel本番URLを指定

### 本番環境
- 本番モードのStripeキーを使用
- 全ての環境変数をVercelに設定
- Webhook URLを本番URLに更新

---

## 次のステップ

1. ✅ Vercel Dashboardで環境変数を設定
2. ✅ 再デプロイ実行
3. ✅ デプロイサイトで決済テスト
4. ✅ エラーログを確認

設定完了後、もう一度決済テストを実行してください。






