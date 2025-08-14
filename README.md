# 87app - 花屋向け店舗管理システム

花屋向けの包括的な店舗管理システム。商品管理、QR決済、売上管理、顧客管理、全国フローリストマップ機能を提供します。

## 🚀 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: TailwindCSS
- **認証・データベース**: Supabase
- **デプロイ**: Vercel
- **アイコン**: Lucide React
- **ルーティング**: React Router DOM
- **地図**: Google Maps Static API
- **QRコード**: qrcode

## 📦 インストール

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# 本番ビルド
npm run build

# プレビュー
npm run preview
```

## 🔧 環境設定

1. `.env`ファイルを作成し、`env.example`を参考に環境変数を設定してください：

```bash
cp env.example .env
```

2. Supabaseプロジェクトを作成し、以下の環境変数を設定：

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_static_api_key_here
```

### Google Maps Static API設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. Maps Static APIを有効化
3. APIキーを作成
4. `.env`ファイルに`VITE_GOOGLE_MAPS_API_KEY`として設定

## 🏗️ プロジェクト構造

```
src/
├── components/          # 再利用可能なコンポーネント
│   ├── auth/           # 認証関連コンポーネント
│   └── LoadingSpinner.tsx
├── contexts/           # React Context
│   └── AuthContext.tsx
├── lib/               # ライブラリ設定
│   └── supabase.ts
├── pages/             # ページコンポーネント
│   ├── MenuScreen.tsx      # メニュー画面
│   ├── CheckoutScreen.tsx  # お客様会計
│   ├── CustomerManagement.tsx # 顧客管理
│   ├── FloristMap.tsx      # 全国フローリストマップ
│   ├── StoreRegistration.tsx # 店舗データ管理
│   └── CustomerRegistration.tsx # 顧客登録
├── services/          # サービス層
│   ├── storeService.ts      # 店舗管理サービス
│   ├── customerService.ts   # 顧客管理サービス
│   ├── pointService.ts      # ポイント管理サービス
│   └── storeOwnerService.ts # 店舗オーナー認証サービス
├── types/             # TypeScript型定義
│   └── index.ts
├── App.tsx            # メインアプリケーション
└── main.tsx           # エントリーポイント
```

## 🔐 認証機能

- 店舗オーナー認証（メール/パスワード）
- 顧客登録・認証
- セッション管理
- 保護されたルート

## 🌸 主要機能

### 店舗管理
- **お客様会計**: 品目入力、合計計算、ポイント管理、QRコード生成
- **顧客管理**: 顧客検索、購入履歴、ポイント管理
- **店舗データ管理**: 店舗情報登録・編集、営業時間、サービス、写真

### 全国フローリストマップ
- **Static Maps API**: 軽量で高速な地図表示
- **店舗検索**: 位置情報による店舗検索
- **詳細表示**: 店舗情報、営業時間、サービス、おすすめの花
- **掲示板**: バイト募集、レッスン募集などの情報

### データベース
- **20店舗のサンプルデータ**: 全国各地の花屋情報
- **顧客管理**: 購入履歴、ポイントシステム
- **店舗オーナー管理**: 認証、プロフィール管理

## 🎨 デザインシステム

- TailwindCSSを使用したモダンなデザイン
- レスポンシブデザイン
- アクセシビリティ対応
- ダークモード対応（準備中）

## 🚀 デプロイ

### Vercel

1. Vercelにプロジェクトを接続
2. 環境変数を設定
3. 自動デプロイが有効になります

### 手動デプロイ

```bash
npm run build
# distフォルダの内容をデプロイ
```

## 📝 開発ガイドライン

- TypeScriptを使用
- ESLintとPrettierでコードフォーマット
- コンポーネントは関数型コンポーネント
- Hooksを使用した状態管理

## 🤝 コントリビューション

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License

## 🆘 サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
