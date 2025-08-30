# 87app-customer

## 🎯 プロジェクト概要

**87app-customer**は、花屋向け店舗管理アプリ「87app」の**顧客向けアプリ**です。

## 🔄 87appとの関係

- **87app（bloemism/87app）**: 店舗管理者向けの本格的な店舗管理システム（デプロイ済み・動作中）
- **87app-customer**: 顧客向けのモバイルアプリ（開発中）

### 開発方針
1. **87appの動作するコードをベース**に開発
2. **87appリポジトリには一切プッシュしない**
3. **87app-customerとして独立した開発**を継続
4. **モバイル対応とUI改善**に集中

## 🚀 現在の状況

### ✅ 完了済み
- 87appから動作するGoogle Maps実装を移植
- 基本的な店舗表示機能
- Supabase連携

### 🔄 開発中
- モバイル対応UI
- 顧客向け機能の最適化

### 📋 今後の予定
- 店舗検索・フィルタリングの改善
- 店舗詳細画面の最適化
- モバイルナビゲーションの改善

## 🛠️ 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **地図**: Google Maps JavaScript API
- **バックエンド**: Supabase
- **決済**: Stripe

## 📱 モバイル対応

- レスポンシブデザイン
- タッチ操作の最適化
- モバイルファーストのUI設計

## 🔑 環境変数

`.env`ファイルに以下を設定してください：

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 🚀 開発サーバー起動

```bash
npm install
npm run dev
```

## 📁 ディレクトリ構造

```
src/
├── components/     # 再利用可能なコンポーネント
├── pages/         # ページコンポーネント
├── services/      # APIサービス
├── lib/           # ライブラリ設定
└── types/         # 型定義
```

## 🎨 UI/UX方針

- **シンプルで直感的**な操作
- **モバイルファースト**の設計
- **花屋らしい**温かみのあるデザイン
- **アクセシビリティ**の考慮

## 🔍 トラブルシューティング

### Google Mapsが表示されない場合
1. 環境変数`VITE_GOOGLE_MAPS_API_KEY`が正しく設定されているか確認
2. Google Maps APIの制限設定を確認
3. ブラウザのコンソールでエラーメッセージを確認

### Supabase接続エラーの場合
1. 環境変数`VITE_SUPABASE_URL`と`VITE_SUPABASE_ANON_KEY`を確認
2. Supabaseプロジェクトの設定を確認
3. ネットワーク接続を確認

## 📞 サポート

開発に関する質問や問題がある場合は、開発チームまでお問い合わせください。

---

**注意**: このプロジェクトは87appとは独立して開発されています。87appリポジトリへの変更は行わないでください。
