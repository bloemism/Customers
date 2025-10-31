# 開発環境でのAPI設定ガイド

## 問題

開発環境（localhost:5174）では、`/api/`エンドポイントが404エラーになります。
これは、Viteの開発サーバーがサーバーレス関数をサポートしていないためです。

## 解決策

### オプション1: Vercelにデプロイ済みのAPIを使用（推奨）

本番環境のAPIを使用します。

#### 手順

1. **環境変数を更新**

`.env`ファイルを作成/更新：

```env
# Supabase
VITE_SUPABASE_URL=https://aoqmdyapjsmmvjrwfdup.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# API Base URL（Vercel本番環境を使用）
VITE_API_BASE_URL=https://customers-hivciwlmc-bloemisms-projects.vercel.app
```

2. **APIサービスを更新**

`src/services/stripeConnectService.ts`などのAPIコールを更新：

```typescript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const createConnectedAccount = async (...) => {
  const response = await fetch(`${apiBaseUrl}/api/create-connected-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ... }),
  });
  // ...
};
```

3. **CORSの確認**

Vercelで自動的にCORSが設定されます。追加設定は不要です。

---

### オプション2: ローカルでAPIサーバーを起動

開発用にExpressサーバーを起動します。

#### 手順

1. **開発用サーバーを作成**

`dev-server.js`を作成：

```javascript
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// APIルート
import createPaymentIntent from './api/create-payment-intent.js';
import createConnectedAccount from './api/create-connected-account.js';
import getConnectedAccount from './api/get-connected-account.js';
import createAccountLink from './api/create-account-link.js';
import stripeWebhook from './api/stripe-webhook.js';

config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// APIエンドポイント
app.post('/api/create-payment-intent', createPaymentIntent);
app.post('/api/create-connected-account', createConnectedAccount);
app.get('/api/get-connected-account', getConnectedAccount);
app.post('/api/create-account-link', createAccountLink);
app.post('/api/stripe-webhook', stripeWebhook);

app.listen(PORT, () => {
  console.log(`Dev API server running on http://localhost:${PORT}`);
});
```

2. **package.jsonにスクリプトを追加**

```json
{
  "scripts": {
    "dev": "vite",
    "dev:api": "node dev-server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:api\""
  }
}
```

3. **環境変数を設定**

`.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

4. **起動**

```bash
npm run dev:all
```

---

### オプション3: Vercel CLIでローカル開発

Vercel CLIを使用して、ローカルでサーバーレス関数を実行します。

#### 手順

1. **Vercel CLIをインストール**

```bash
npm install -g vercel
```

2. **ローカル開発サーバーを起動**

```bash
vercel dev
```

これにより、`http://localhost:3000`でアプリが起動し、APIエンドポイントも動作します。

3. **環境変数を設定**

Vercelダッシュボードで設定した環境変数がローカルで使用されます。

---

## 推奨設定

**開発環境**: オプション1（Vercel本番APIを使用）
**理由**:
- 最もシンプル
- 本番環境と同じ動作
- 追加のサーバー不要

**注意**: テストデータを使用し、本番データを汚染しないようにしてください。

---

## 現在の状況

✅ **Vercelにデプロイ済み**
- URL: https://customers-hivciwlmc-bloemisms-projects.vercel.app
- APIエンドポイント:
  - POST /api/create-payment-intent
  - POST /api/create-connected-account
  - GET /api/get-connected-account
  - POST /api/create-account-link
  - POST /api/stripe-webhook

❌ **ローカル開発環境**
- localhost:5174 でAPIが404エラー
- 上記のオプションで修正可能

---

## 次のステップ

1. `.env`ファイルに`VITE_API_BASE_URL`を追加
2. APIサービスを更新してベースURLを使用
3. 開発サーバーを再起動
4. 決済フローをテスト






