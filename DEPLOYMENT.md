# 87app デプロイメントガイド

## 🚀 Vercelデプロイ手順

### 1. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

```bash
# Supabase設定
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Maps設定
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Stripe設定
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# アプリケーション設定
VITE_APP_NAME=87アプリ
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

### 2. デプロイコマンド

```bash
# ローカルビルドテスト
npm run build

# Vercelデプロイ
npm run deploy:vercel
```

### 3. パフォーマンス最適化

- **チャンク分割**: ライブラリごとに最適化されたチャンク分割
- **Tree Shaking**: 未使用コードの自動削除
- **圧縮**: Terserによる高度な圧縮
- **キャッシュ**: 静的アセットの長期キャッシュ

### 4. セキュリティ設定

- **CSP**: Content Security Policy
- **XSS Protection**: クロスサイトスクリプティング対策
- **Frame Options**: クリックジャッキング対策

### 5. トラブルシューティング

#### ビルドエラー
```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# 型チェック
npm run type-check

# リント
npm run lint:fix
```

#### デプロイエラー
- Vercelのログを確認
- 環境変数の設定を確認
- Node.jsバージョン（18.x以上）を確認

## 📊 パフォーマンス指標

- **初回読み込み**: < 3秒
- **チャンクサイズ**: < 1MB
- **Lighthouse Score**: > 90

## 🔧 開発環境

```bash
# 開発サーバー起動
npm run dev

# プレビュー
npm run preview

# バンドル分析
npm run build:analyze
```
