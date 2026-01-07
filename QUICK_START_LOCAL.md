# ローカル環境での決済ページ開発 - クイックスタート

## 問題

CORSエラーが発生しています。ローカル環境（localhost:5173）からVercelのAPIエンドポイントにアクセスしようとしているためです。

## 解決方法

ローカルAPIサーバーを使用するように設定を変更します。

### 1. `.env`ファイルの設定

プロジェクトルートの`.env`ファイルを編集：

```env
# ローカルAPIサーバーを使用
VITE_API_BASE_URL=http://localhost:3000

# Stripe設定（必須）
STRIPE_SECRET_KEY=sk_live_***（実際のキーに置き換えてください）

# Supabase設定
VITE_SUPABASE_URL=https://aoqmdyapjsmmvjrwfdup.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTY2NTAsImV4cCI6MjA3MDU3MjY1MH0.jPQ4jGvuLDDZ4sFU1sbakWJIRyBKbEkaXsTnirQR4PY

# Supabase Service Role Key（APIエンドポイントで使用）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NjY1MCwiZXhwIjoyMDcwNTcyNjUwfQ.v8vniAL-aYfmFZgVDfBa6q_RoTrvmE_uXQjQweLiui8
```

**重要**: `VITE_API_BASE_URL=http://localhost:3000` に変更してください。

### 2. ローカルAPIサーバーとフロントエンドを起動

```bash
npm run dev:full
```

これにより、以下が同時に起動します：
- フロントエンド: `http://localhost:5173`
- APIサーバー: `http://localhost:3000`

### 3. テスト

1. ブラウザで `http://localhost:5173/stripe-connect-payment` にアクセス
2. 決済情報を入力
3. 「Stripe Connectで決済する」ボタンをクリック
4. CORSエラーが解消されていることを確認

## トラブルシューティング

### ポート3000が既に使用されている場合

`server-local.js`の`PORT`を変更：

```javascript
const PORT = process.env.PORT || 3001;
```

`.env`ファイルにも設定：

```env
PORT=3001
VITE_API_BASE_URL=http://localhost:3001
```

### ローカルAPIサーバーが起動しない場合

1. `npm install`を実行して依存関係をインストール
2. `node server-local.js`を直接実行してエラーを確認

### 環境変数が読み込まれない場合

`.env`ファイルがプロジェクトルートにあることを確認してください。

