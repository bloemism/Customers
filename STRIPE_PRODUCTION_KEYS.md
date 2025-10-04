# Stripe本番環境キー設定

## 本番用Stripeキー

### 公開キー（フロントエンド用）
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_***（機密情報のため記載省略）
```

### 秘密キー（サーバーサイド用）
```
STRIPE_SECRET_KEY=sk_live_***（機密情報のため記載省略）
```

### Connect Client ID
```
STRIPE_CONNECT_CLIENT_ID=ca_***（機密情報のため記載省略）
```

## 環境変数設定

### .env ファイル
```bash
# Supabase設定
VITE_SUPABASE_URL=https://aoqmdyapjsmmvjrwfdup.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTY2NTAsImV4cCI6MjA3MDU3MjY1MH0.jPQ4jGvuLDDZ4sFU1sbakWJIRjBKbEkaXsTnirQR4PY

# Google Maps設定
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDcJkaHDTPcgBSfr2923T6K6YT_kiL3s4g

# Stripe設定（本番用）
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_***（機密情報のため記載省略）

# Stripe設定（サーバーサイド用）
STRIPE_SECRET_KEY=sk_live_***（機密情報のため記載省略）
STRIPE_CONNECT_CLIENT_ID=ca_***（機密情報のため記載省略）

# アプリケーション設定
VITE_APP_NAME=Bloemism Customers
VITE_APP_VERSION=1.0.0

# 開発環境設定
VITE_DEV_MODE=false
```

## Supabase Edge Function環境変数

### Supabaseダッシュボードで設定
1. **Supabaseダッシュボード** → **Edge Functions** → **Settings**
2. **Environment Variables**に以下を追加：

```bash
STRIPE_SECRET_KEY=sk_live_***（機密情報のため記載省略）
STRIPE_CONNECT_CLIENT_ID=ca_***（機密情報のため記載省略）
SUPABASE_URL=https://aoqmdyapjsmmvjrwfdup.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Vercel環境変数

### Vercelダッシュボードで設定
1. **Vercelダッシュボード** → **Project Settings** → **Environment Variables**
2. 以下を追加：

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_***（機密情報のため記載省略）
VITE_SUPABASE_URL=https://aoqmdyapjsmmvjrwfdup.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTY2NTAsImV4cCI6MjA3MDU3MjY1MH0.jPQ4jGvuLDDZ4sFU1sbakWJIRjBKbEkaXsTnirQR4PY
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDcJkaHDTPcgBSfr2923T6K6YT_kiL3s4g
```

## 注意事項

### セキュリティ
- **秘密キーは絶対にフロントエンドに公開しない**
- **本番環境でのみ使用する**
- **GitHubにコミットしない**

### テスト
- 本番キーでの決済は実際の金額が発生します
- テスト時は少額で確認してください
- Stripeダッシュボードで決済状況を確認してください

### 監視
- Stripeダッシュボードで決済状況を監視
- エラーログの確認
- 不正利用の監視

