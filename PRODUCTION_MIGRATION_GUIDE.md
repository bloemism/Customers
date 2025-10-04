# 本番環境への移行ガイド

## 1. Stripe本番キーの設定

### 現在の設定（テスト用）
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_***
STRIPE_SECRET_KEY=sk_test_***
```

### 本番用設定
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_***
STRIPE_SECRET_KEY=sk_live_***
```

## 2. 本番用Checkout URLの作成

### 手順
1. **Stripeダッシュボード**にログイン
2. **Payment Links** → **Create payment link**
3. **商品設定**:
   - 商品名: `Bloemism 決済`
   - 価格: 任意（動的決済の場合は参考価格）
   - 通貨: JPY
4. **本番用URLを取得**: `https://buy.stripe.com/your_live_url_here`

### コードの更新
```typescript
// src/pages/StripeCheckout.tsx
const checkoutUrl = new URL('https://buy.stripe.com/your_live_url_here');
```

## 3. 環境変数の更新

### ローカル環境
```bash
# .env ファイル
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_***
VITE_DEV_MODE=false
```

### Vercel環境
```bash
# Vercelダッシュボード → Environment Variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_***
VITE_DEV_MODE=false
```

### Supabase Edge Functions
```bash
# Supabaseダッシュボード → Edge Functions → Settings
STRIPE_SECRET_KEY=sk_live_***
```

## 4. 本番環境での注意事項

### セキュリティ
- ✅ **本番キーの保護**: 絶対に公開しない
- ✅ **HTTPS必須**: 本番環境では必須
- ✅ **Webhook設定**: 本番用エンドポイント

### テスト
- ✅ **少額でのテスト**: 実際の金額が発生
- ✅ **決済確認**: Stripeダッシュボードで確認
- ✅ **返金テスト**: 必要に応じて返金処理

### 監視
- ✅ **決済ログ**: Stripeダッシュボードで監視
- ✅ **エラー監視**: アプリケーションログ
- ✅ **不正利用監視**: 異常な決済パターン

## 5. 移行チェックリスト

### 事前準備
- [ ] Stripe本番アカウントの準備
- [ ] 本番用キーの取得
- [ ] 本番用Checkout URLの作成

### 設定変更
- [ ] 環境変数の更新
- [ ] コードの更新
- [ ] データベースの本番設定

### テスト
- [ ] 少額での決済テスト
- [ ] 決済完了フローの確認
- [ ] エラーハンドリングの確認

### デプロイ
- [ ] Vercelへの本番デプロイ
- [ ] Supabase Edge Functionsの更新
- [ ] ドメイン設定

### 本番稼働
- [ ] 監視設定
- [ ] サポート体制
- [ ] 緊急時対応手順

## 6. トラブルシューティング

### よくある問題
1. **決済が失敗する**
   - キーが正しく設定されているか確認
   - アカウントの審査状況を確認

2. **金額が反映されない**
   - 動的決済機能を使用
   - Payment Intent APIの設定確認

3. **Webhookが動作しない**
   - 本番用エンドポイントの設定
   - HTTPS証明書の確認

### 緊急時対応
- **決済停止**: Stripeダッシュボードで一時停止
- **返金処理**: Stripeダッシュボードで返金
- **ログ確認**: エラーログの詳細確認

## 7. 本番環境での推奨設定

### 決済制限
- **1回あたりの最大金額**: 設定推奨
- **1日あたりの最大金額**: 設定推奨
- **不正検知**: 有効化推奨

### 監視設定
- **決済通知**: メール通知設定
- **エラー通知**: 即座に通知
- **レポート**: 定期的な売上レポート

### バックアップ
- **決済データ**: 定期的なバックアップ
- **設定情報**: 設定ファイルのバックアップ
- **ログ**: ログファイルの保存
