#!/bin/bash

# 87アプリ デプロイスクリプト
# 本番環境へのデプロイ用

set -e

echo "🚀 87アプリ デプロイ開始..."

# 環境変数の確認
echo "📋 環境変数チェック..."
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ VITE_SUPABASE_URL が設定されていません"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ VITE_SUPABASE_ANON_KEY が設定されていません"
    exit 1
fi

if [ -z "$VITE_GOOGLE_MAPS_API_KEY" ]; then
    echo "❌ VITE_GOOGLE_MAPS_API_KEY が設定されていません"
    exit 1
fi

if [ -z "$VITE_STRIPE_PUBLISHABLE_KEY" ]; then
    echo "❌ VITE_STRIPE_PUBLISHABLE_KEY が設定されていません"
    exit 1
fi

echo "✅ 環境変数チェック完了"

# 依存関係のインストール
echo "📦 依存関係のインストール..."
npm ci --only=production

# 型チェック
echo "🔍 TypeScript型チェック..."
npm run type-check

# リント
echo "🧹 コードリント..."
npm run lint

# ビルド
echo "🏗️  本番ビルド..."
npm run build:prod

# ビルド結果の確認
if [ ! -d "dist" ]; then
    echo "❌ ビルドが失敗しました"
    exit 1
fi

echo "✅ ビルド完了"

# ファイルサイズの確認
echo "📊 ビルド結果の確認..."
du -sh dist/*
echo ""

# デプロイ先の確認
if [ "$1" = "vercel" ]; then
    echo "🚀 Vercelにデプロイ..."
    npx vercel --prod
elif [ "$1" = "preview" ]; then
    echo "👀 プレビューデプロイ..."
    npx vercel
else
    echo "📁 ビルドファイルが dist/ に生成されました"
    echo "手動でデプロイしてください"
fi

echo "🎉 デプロイ完了！"
