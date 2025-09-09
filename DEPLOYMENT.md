# 87アプリ デプロイメントガイド

## 概要
87アプリ（花屋プラットフォーム）の本番環境へのデプロイ手順を説明します。

## 前提条件
- Node.js 18.0.0以上
- npm 8.0.0以上
- Supabaseプロジェクト
- Google Cloud Consoleプロジェクト
- Stripeアカウント

## 環境変数の設定

### 1. 本番環境用環境変数ファイルの作成
```bash
cp env.production.example .env.production
```

### 2. 環境変数の設定
`.env.production`ファイルを編集し、以下の値を設定してください：

```env
# Supabase設定（本番環境）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key_here

# Google Maps設定（本番環境）
VITE_GOOGLE_MAPS_API_KEY=your_production_google_maps_key_here

# Stripe設定（本番環境）
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_key_here

# アプリケーション設定
VITE_APP_NAME=87アプリ
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# 本番環境設定
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
```

## デプロイ方法

### 方法1: 自動デプロイスクリプト（推奨）
```bash
# Vercelにデプロイ
./scripts/deploy.sh vercel

# プレビューデプロイ
./scripts/deploy.sh preview

# ビルドのみ
./scripts/deploy.sh
```

### 方法2: 手動デプロイ
```bash
# 依存関係のインストール
npm ci

# 型チェック
npm run type-check

# リント
npm run lint

# 本番ビルド
npm run build:prod

# Vercelにデプロイ
npx vercel --prod
```

## 本番環境の設定

### Supabase設定
1. Supabaseダッシュボードで本番プロジェクトを作成
2. 認証設定でGoogle OAuthを有効化
3. 本番用のリダイレクトURLを設定：
   - `https://your-domain.com/auth/callback`
4. RLS（Row Level Security）を有効化

### Google OAuth設定
1. Google Cloud Consoleで本番用プロジェクトを作成
2. OAuth同意画面を設定
3. 本番用のリダイレクトURIを追加：
   - `https://your-domain.com/auth/callback`
4. 本番用のAPIキーを作成

### Stripe設定
1. Stripeダッシュボードで本番モードに切り替え
2. 本番用の公開可能キーを取得
3. Webhookエンドポイントを設定

## セキュリティ設定

### Content Security Policy (CSP)
本番環境では以下のCSPが適用されます：
- スクリプト: 自己ドメイン、Stripe、Google Maps
- スタイル: 自己ドメイン、インライン
- 画像: 自己ドメイン、data URI、HTTPS
- 接続: Supabase、Stripe、Google Maps

### セキュリティヘッダー
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Referrer-Policy: strict-origin-when-cross-origin

## パフォーマンス最適化

### ビルド最適化
- コード分割によるチャンク最適化
- Tree shakingによる未使用コードの削除
- Terserによる圧縮
- 本番環境でのconsole.logの削除

### キャッシュ戦略
- 静的アセット: 1年間のキャッシュ
- HTML: キャッシュなし
- API: 適切なキャッシュヘッダー

## 監視とログ

### エラー監視
本番環境では以下の監視が有効：
- コンソールエラーの自動報告
- ネットワークエラーの監視
- パフォーマンスメトリクスの収集

### ログレベル
本番環境では以下のログが制限されます：
- デバッグログ: 無効
- 情報ログ: 最小限
- エラーログ: 有効

## トラブルシューティング

### よくある問題

1. **環境変数が読み込まれない**
   - `.env.production`ファイルが正しい場所にあるか確認
   - 環境変数名が`VITE_`で始まっているか確認

2. **Supabase接続エラー**
   - 本番用のURLとキーが正しいか確認
   - RLS設定が適切か確認

3. **Google OAuthエラー**
   - リダイレクトURIが正しく設定されているか確認
   - 本番用のクライアントIDを使用しているか確認

4. **Stripe決済エラー**
   - 本番用の公開可能キーを使用しているか確認
   - Webhookエンドポイントが設定されているか確認

## メンテナンス

### 定期的な作業
- 依存関係の更新
- セキュリティパッチの適用
- パフォーマンス監視
- ログの確認とクリーンアップ

### バックアップ
- Supabaseデータベースの定期バックアップ
- 環境変数の安全な保管
- デプロイメント設定のバージョン管理

## サポート

問題が発生した場合は、以下を確認してください：
1. ログファイルの確認
2. 環境変数の設定確認
3. 外部サービスの状態確認
4. ドキュメントの確認

---

**注意**: 本番環境へのデプロイ前に、必ずステージング環境でテストを行ってください。