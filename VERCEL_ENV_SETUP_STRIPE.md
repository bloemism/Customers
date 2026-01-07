# Vercel環境変数設定ガイド（Stripe決済用）

## 問題

500エラーが発生しています。原因は、Vercelの環境変数に`STRIPE_SECRET_KEY`が設定されていないことです。

## 必要な環境変数

Vercel Dashboardで以下の環境変数を設定してください：

### 必須環境変数

1. **STRIPE_SECRET_KEY**
   - **説明**: Stripeのシークレットキー（サーバー側で使用）
   - **取得方法**: [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → API keys → Secret key
   - **形式**: `sk_test_...`（テスト環境）または`sk_live_...`（本番環境）
   - **環境**: Production, Preview, Development すべてに設定

### オプション環境変数（フロントエンド用）

2. **VITE_STRIPE_PUBLISHABLE_KEY**
   - **説明**: Stripeの公開キー（フロントエンドで使用）
   - **取得方法**: [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → API keys → Publishable key
   - **形式**: `pk_test_...`（テスト環境）または`pk_live_...`（本番環境）
   - **環境**: Production, Preview, Development すべてに設定
   - **注意**: 現在の実装では使用していませんが、将来的に使用する可能性があります

## 設定手順

### 1. Vercel Dashboardにアクセス

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. プロジェクト「customers」を選択
3. Settings → Environment Variables を開く

### 2. 環境変数を追加

1. **Key**: `STRIPE_SECRET_KEY`
2. **Value**: Stripe Dashboardから取得したシークレットキー（`sk_test_...`または`sk_live_...`）
3. **Environment**: Production, Preview, Development すべてにチェックを入れる
4. **Save** をクリック

### 3. 再デプロイ

環境変数を追加/変更した後、**再デプロイが必要**です：

1. Vercel Dashboard → Deployments
2. 最新のデプロイメントの「...」メニューから「Redeploy」を選択
3. または、GitHubにプッシュして自動デプロイを待つ

## 現在設定されている環境変数

以下の環境変数は既に設定されています：

- ✅ `VITE_GOOGLE_MAPS_API_KEY`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `VITE_SUPABASE_URL`

## 設定が必要な環境変数

- ❌ `STRIPE_SECRET_KEY` ← **これが設定されていないため500エラーが発生**

## 確認方法

環境変数が正しく設定されているか確認するには：

1. Vercel Dashboard → Deployments → 最新のデプロイメント
2. Functions タブ → `api/create-payment-intent` をクリック
3. ログで以下を確認：
   - `環境変数確認: STRIPE_SECRET_KEY_exists: true` になっているか
   - `Stripe初期化成功` というログが表示されているか

## トラブルシューティング

### 500エラーが続く場合

1. **環境変数の確認**
   - Vercel Dashboardで`STRIPE_SECRET_KEY`が設定されているか確認
   - 値が正しいか確認（`sk_test_...`または`sk_live_...`で始まる必要がある）

2. **再デプロイの確認**
   - 環境変数を追加/変更した後、再デプロイが完了しているか確認
   - 再デプロイには数分かかる場合があります

3. **ログの確認**
   - Vercel Dashboard → Deployments → Functions → `api/create-payment-intent`
   - エラーログを確認して、具体的なエラーメッセージを確認

### 環境変数が読み込まれない場合

- 環境変数の名前が正しいか確認（`STRIPE_SECRET_KEY`、大文字小文字を区別）
- 環境変数の値に余分なスペースや改行が含まれていないか確認
- 再デプロイを実行しているか確認

## セキュリティ注意事項

⚠️ **重要**: `STRIPE_SECRET_KEY`は機密情報です。以下の点に注意してください：

1. **Gitにコミットしない**: `.env`ファイルを`.gitignore`に追加
2. **公開しない**: GitHubやその他の公開リポジトリにコミットしない
3. **定期的にローテーション**: セキュリティ上の理由から、定期的にキーを変更することを推奨

## 参考資料

- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Stripe Connect Documentation](https://stripe.com/docs/connect)

