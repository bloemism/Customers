# STRIPE_SECRET_KEY 環境変数設定手順

## 設定手順

### 1. Vercel Dashboardで環境変数を追加

1. [Vercel環境変数設定ページ](https://vercel.com/bloemisms-projects/~/settings/environment-variables)にアクセス
2. **Add New** ボタンをクリック
3. 以下の情報を入力：
   - **Key**: `STRIPE_SECRET_KEY`
   - **Value**: Stripe Dashboardから取得したシークレットキー
     - テスト環境: `sk_test_...`で始まるキー
     - 本番環境: `sk_live_...`で始まるキー
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - すべてにチェックを入れる
4. **Save** をクリック

### 2. Stripe Dashboardでキーを取得

1. [Stripe Dashboard - API Keys](https://dashboard.stripe.com/apikeys)にアクセス
2. **Secret key** をコピー
   - テスト環境: 「Reveal test key」をクリックして表示
   - 本番環境: 「Reveal live key」をクリックして表示

### 3. 再デプロイ（重要）

環境変数を追加/変更した後、**必ず再デプロイ**が必要です：

1. Vercel Dashboard → **Deployments**
2. 最新のデプロイメントの「**...**」メニューをクリック
3. **Redeploy** を選択
4. 再デプロイが完了するまで待つ（約30秒〜1分）

## 確認方法

### 1. 環境変数が設定されているか確認

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. `STRIPE_SECRET_KEY` が表示されているか確認
3. 各環境（Production, Preview, Development）にチェックが入っているか確認

### 2. ログで確認

再デプロイ後、以下の手順でログを確認：

1. Vercel Dashboard → **Deployments** → 最新のデプロイメント
2. **Functions** タブをクリック
3. `api/create-payment-intent` をクリック
4. ログで以下を確認：
   ```
   環境変数確認: {
     STRIPE_SECRET_KEY_exists: true,
     STRIPE_SECRET_KEY_length: 107,  // キーの長さ（例）
     STRIPE_SECRET_KEY_prefix: "sk_test_...",
     all_env_keys: "STRIPE_SECRET_KEY"
   }
   Stripe Secret Key確認: {
     keyPrefix: "sk_test_",
     keyLength: 107,
     isTestKey: true,
     isLiveKey: false
   }
   Stripe初期化成功
   ```

### 3. テスト決済で確認

1. ブラウザで `http://localhost:5173/stripe-connect-payment` にアクセス
2. 決済情報を入力
3. 「Stripe Connectで決済する」ボタンをクリック
4. エラーが発生しないことを確認

## トラブルシューティング

### ログに何も表示されない場合

1. **再デプロイを確認**
   - 環境変数を追加した後、再デプロイが完了しているか確認
   - 再デプロイには数分かかる場合があります

2. **環境変数の値を確認**
   - 値が正しいか確認（`sk_test_...`または`sk_live_...`で始まる必要がある）
   - 余分なスペースや改行が含まれていないか確認

3. **関数が実行されているか確認**
   - ブラウザのコンソールでエラーを確認
   - ネットワークタブでAPIリクエストが送信されているか確認

### 500エラーが続く場合

1. **Vercelログを確認**
   - Functions タブでエラーログを確認
   - エラーメッセージの詳細を確認

2. **環境変数の形式を確認**
   - `STRIPE_SECRET_KEY`は`sk_test_`または`sk_live_`で始まる必要がある
   - キーの全体が正しくコピーされているか確認

3. **再デプロイを実行**
   - 環境変数を修正した後、必ず再デプロイを実行

## セキュリティ注意事項

⚠️ **重要**: `STRIPE_SECRET_KEY`は機密情報です。

- ✅ Vercel Dashboardでのみ管理
- ❌ Gitにコミットしない
- ❌ 公開リポジトリにコミットしない
- ❌ ログやエラーメッセージに表示しない

## 参考リンク

- [Vercel環境変数設定](https://vercel.com/bloemisms-projects/~/settings/environment-variables)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)

