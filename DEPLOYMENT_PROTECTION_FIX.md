# Deployment Protection 修正ガイド

## 問題

Vercelの**Deployment Protection**（デプロイメント保護）がAPIアクセスをブロックしています。

エラー: `Authentication Required (401)`

---

## 即座の修正方法

### Vercel Dashboardで設定変更

ブラウザで以下のページを開いてください：
https://vercel.com/bloemisms-projects/customers/settings/deployment-protection

### 手順

1. **「Deployment Protection」**セクションを探す

2. **現在の設定を確認**
   - 「Vercel Authentication」が有効になっている場合は無効化

3. **Protection Level を変更**
   - **現在**: 「Standard Protection」または「Vercel Authentication」
   - **変更後**: 「None」

4. **「Save」をクリック**

5. **即座に反映されます**（再デプロイ不要）

---

## 別の方法: 環境変数でバイパス

もしDeployment Protectionを維持したい場合：

### 方法A: Protection Bypass for Automation

1. Deployment Protection設定ページで
2. 「Protection Bypass for Automation」セクション
3. トークンを生成
4. APIリクエストヘッダーに追加:
   ```
   x-vercel-protection-bypass: <token>
   ```

### 方法B: 特定パスを除外

残念ながら、Vercelでは特定のパス（`/api/*`）を保護から除外することはできません。

---

## 推奨設定

### 開発・テスト段階
```
Deployment Protection: None
```

理由:
- APIテストが容易
- 外部からのアクセスが必要
- テストモードなので実害なし

### 本番環境
```
Deployment Protection: Standard Protection
または
Vercel Authentication (必要に応じて)
```

---

## 確認方法

### 設定変更後

1. **30秒待つ**（設定が反映されるまで）

2. **APIをテスト**
   ブラウザで以下のURLにアクセス:
   ```
   https://customers-g9zzbmh81-bloemisms-projects.vercel.app/api/create-payment-intent
   ```

3. **期待される結果**
   - **間違い**: 「Authentication Required」ページ
   - **正しい**: `{"error":"Method not allowed"}` （GETメソッドのため）

---

## トラブルシューティング

### それでも401エラーが出る場合

1. **ブラウザのキャッシュをクリア**
   - Cmd+Shift+R（Mac）
   - Ctrl+Shift+R（Windows）

2. **シークレットモードで確認**

3. **Vercelサポートに問い合わせ**
   - プロジェクトにカスタム保護設定がかかっている可能性

---

## 完了後のテスト

1. ✅ Deployment Protection を None に変更
2. ✅ 30秒待つ
3. ✅ APIテストを実行
4. ✅ 401エラーが消える
5. ✅ デプロイサイトで決済テスト

---

Vercel Dashboardで**Deployment Protection を None に変更**してください！


