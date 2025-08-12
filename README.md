# 87アプリ

最新のテクノロジーとデザインを融合させた、次世代のウェブアプリケーション。

## 🚀 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: TailwindCSS
- **認証・データベース**: Supabase
- **デプロイ**: Vercel
- **アイコン**: Lucide React
- **ルーティング**: React Router DOM

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
```

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
│   └── Home.tsx
├── types/             # TypeScript型定義
│   └── index.ts
├── App.tsx            # メインアプリケーション
└── main.tsx           # エントリーポイント
```

## 🔐 認証機能

- メール/パスワード認証
- Google OAuth認証
- セッション管理
- 保護されたルート

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
