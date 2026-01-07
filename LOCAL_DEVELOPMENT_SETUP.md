# ローカル環境での決済ページ開発ガイド

## 概要

Vercelのデプロイを最小限にするため、ローカル環境で決済ページを開発・テストできるようにします。

## セットアップ方法

### 1. 必要なパッケージのインストール

```bash
npm install express cors dotenv concurrently
```

### 2. 環境変数の設定

プロジェクトルートに`.env`ファイルを作成（または既存のファイルを編集）：

```env
# Stripe設定
STRIPE_SECRET_KEY=sk_live_***（実際のキーに置き換えてください）

# API Base URL（ローカル開発サーバー）
VITE_API_BASE_URL=http://localhost:3000

# Supabase設定（既存の値を使用）
VITE_SUPABASE_URL=https://aoqmdyapjsmmvjrwfdup.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTY2NTAsImV4cCI6MjA3MDU3MjY1MH0.jPQ4jGvuLDDZ4sFU1sbakWJIRyBKbEkaXsTnirQR4PY

# Supabase Service Role Key（APIエンドポイントで使用）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NjY1MCwiZXhwIjoyMDcwNTcyNjUwfQ.v8vniAL-aYfmFZgVDfBa6q_RoTrvmE_uXQjQweLiui8
```

### 3. 開発サーバーの起動

#### 方法1: ローカルAPIサーバーのみ起動

```bash
npm run dev:local
```

これにより、`http://localhost:3000`でAPIエンドポイントが利用可能になります。

#### 方法2: フロントエンドとAPIサーバーを同時に起動（推奨）

```bash
npm run dev:full
```

これにより、以下が同時に起動します：
- フロントエンド: `http://localhost:5173`
- APIサーバー: `http://localhost:3000`

### 4. フロントエンドのみ起動（別ターミナルで）

別のターミナルで：

```bash
npm run dev
```

## 使用方法

### 1. 決済ページにアクセス

ブラウザで以下のURLにアクセス：

```
http://localhost:5173/stripe-connect-payment
```

または

```
http://localhost:5173/store-payment
```

### 2. テスト決済の実行

1. 決済情報を入力
2. 「Stripe Connectで決済する」ボタンをクリック
3. Stripe Checkoutページでテストカードで決済

### 3. APIエンドポイントの確認

ローカルAPIサーバーが起動している場合、以下のエンドポイントが利用可能です：

- `http://localhost:3000/api/create-payment-intent`
- `http://localhost:3000/api/create-connect-payment-intent`
- `http://localhost:3000/health` (ヘルスチェック)

## トラブルシューティング

### 1. ポートが既に使用されている場合

`server-local.js`の`PORT`を変更：

```javascript
const PORT = process.env.PORT || 3001; // 3000の代わりに3001を使用
```

`.env`ファイルにも設定：

```env
PORT=3001
VITE_API_BASE_URL=http://localhost:3001
```

### 2. モジュールが見つからないエラー

```bash
npm install express cors dotenv concurrently
```

### 3. CORSエラー

`server-local.js`のCORS設定を確認：

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
```

### 4. 環境変数が読み込まれない

`.env`ファイルがプロジェクトルートにあることを確認し、`dotenv`が正しく設定されているか確認してください。

## 開発の流れ

1. **ローカルで開発・テスト**
   - `npm run dev:full`でローカル環境を起動
   - 決済ページをテスト
   - エラーを修正

2. **動作確認後、必要最小限のデプロイ**
   - 重要な変更のみをGitHubにプッシュ
   - Vercelが自動デプロイ（プロ上限を考慮）

## メリット

- ✅ Vercelのデプロイ回数を最小限に
- ✅ ローカルで高速に開発・テスト可能
- ✅ デバッグが容易
- ✅ インターネット接続が不要（Stripe APIへの接続は必要）

## 注意事項

- ローカル環境では、Stripe APIへの接続は必要です
- `.env`ファイルはGitにコミットしないでください（`.gitignore`に追加）
- 本番環境のキーを使用する場合は、セキュリティに注意してください

