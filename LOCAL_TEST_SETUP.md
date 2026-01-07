# ローカル環境でのStripe Connect決済テスト設定

## 問題

ローカル環境（localhost:5173）でStripe Connect決済ページをテストする際、404エラーが発生します。

**原因**: Viteの開発サーバーでは、`api/`フォルダ内のファイルは自動的にAPIエンドポイントとして機能しません。これらはVercelのサーバーレス関数として動作するように設計されています。

## 解決方法

### 方法1: VercelのAPIエンドポイントを使用（推奨）

ローカル環境でもVercelのAPIエンドポイントを使用するように設定します。

#### 1. `.env`ファイルの設定

プロジェクトルートに`.env`ファイルを作成（または既存のファイルを編集）：

```env
VITE_API_BASE_URL=https://customers-three-rust.vercel.app
STRIPE_SECRET_KEY=sk_test_...（またはsk_live_...）
```

#### 2. 開発サーバーの再起動

環境変数を変更した後、開発サーバーを再起動：

```bash
# 開発サーバーを停止（Ctrl+C）
# 再度起動
npm run dev
```

### 方法2: Vercel CLIを使用してローカルでAPIエンドポイントを実行

Vercel CLIをインストールして、ローカルでサーバーレス関数を実行できます。

#### 1. Vercel CLIのインストール

```bash
npm install -g vercel
```

#### 2. Vercelにログイン

```bash
vercel login
```

#### 3. ローカル開発サーバーの起動

```bash
vercel dev
```

これにより、`api/`フォルダ内のファイルがローカルでAPIエンドポイントとして動作します。

## 現在の設定

`src/pages/StripeConnectPayment.tsx`では、以下のように設定されています：

```typescript
// API Base URL（ローカル環境ではVercelのAPIエンドポイントを使用）
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
if (!API_BASE_URL) {
  // ローカル環境ではVercelのAPIエンドポイントを使用
  API_BASE_URL = 'https://customers-three-rust.vercel.app';
}
```

これにより、環境変数が設定されていない場合でも、VercelのAPIエンドポイントが使用されます。

## テスト手順

1. `.env`ファイルに`VITE_API_BASE_URL`を設定（オプション）
2. 開発サーバーを起動: `npm run dev`
3. ブラウザで `http://localhost:5173/stripe-connect-payment` にアクセス
4. 決済情報を入力してテスト

## エラーメッセージの改善

404エラーが発生した場合、より詳細なエラーメッセージが表示されるようになりました：

- APIエンドポイントのURL
- HTTPステータスコード
- エラーの詳細情報

## トラブルシューティング

### 1. 404エラーが続く場合

**確認事項**:
- `.env`ファイルに`VITE_API_BASE_URL`が設定されているか
- 開発サーバーを再起動したか
- VercelのAPIエンドポイントが正しく動作しているか

**解決方法**:
- ブラウザのコンソールでエラーメッセージを確認
- `API_BASE_URL`の値を確認
- Vercel DashboardでAPIエンドポイントのログを確認

### 2. CORSエラーが発生する場合

**原因**: VercelのAPIエンドポイントのCORS設定が正しくない

**解決方法**:
- `api/create-connect-payment-intent.js`のCORSヘッダーを確認
- `vercel.json`のCORS設定を確認

### 3. 環境変数が読み込まれない場合

**原因**: 環境変数の命名規則が間違っている

**解決方法**:
- Viteでは、クライアント側で使用する環境変数は`VITE_`プレフィックスが必要
- サーバー側（APIエンドポイント）で使用する環境変数は`VITE_`プレフィックスは不要

## 参考資料

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

