# 401エラーとCORSエラーの修正方法

## 問題

Preview環境（`customers-togd-git-main-bloemisms-projects.vercel.app`）からProduction環境（`customers-three-rust.vercel.app`）のAPIにアクセスしようとしているため、401エラーとCORSエラーが発生しています。

## 原因

1. `VITE_API_BASE_URL`が`https://customers-three-rust.vercel.app`に設定されている
2. Preview環境からProduction環境のAPIにアクセスしようとしている
3. Preview環境がDeployment Protectionで保護されているため、401エラーが発生

## 解決方法

### 方法1: 同じデプロイメント内でAPIにアクセス（推奨）

**Vercelの環境変数から`VITE_API_BASE_URL`を削除するか、空にする**

1. **Vercel Dashboardにアクセス**
   https://vercel.com/bloemisms-projects/customers/settings/environment-variables

2. **`VITE_API_BASE_URL`を探す**
   - 存在する場合は削除
   - または、値を空にする

3. **再デプロイ**
   - 環境変数を削除/変更後、再デプロイが必要です

**理由:**
- `VITE_API_BASE_URL`が空の場合、コードは相対パス（`/api/...`）を使用します
- これにより、同じデプロイメント内のAPIにアクセスできます
- Preview環境からPreview環境のAPI、Production環境からProduction環境のAPIにアクセスできます

### 方法2: Deployment Protectionを無効化

1. **Vercel Dashboardにアクセス**
   https://vercel.com/bloemisms-projects/customers/settings/deployment-protection

2. **Protection Level を変更**
   - 「None」を選択
   - または「enable for」を「off」にする

3. **「Save」をクリック**

4. **30秒待つ**（設定が反映されるまで）

### 方法3: Production環境にデプロイしてテスト

Production環境にデプロイすれば、同じ環境内でAPIにアクセスできます。

```bash
cd /Users/user/bloemtarot
git push origin main
# Vercelが自動的にProduction環境にデプロイします
```

## 推奨設定

### 環境変数

**`VITE_API_BASE_URL`は設定しない（空にする）**

理由:
- 相対パス（`/api/...`）を使用することで、同じデプロイメント内のAPIにアクセスできる
- Preview環境とProduction環境の両方で動作する
- 環境ごとに異なるURLを設定する必要がない

### Deployment Protection

**テスト環境: 「None」**
- APIテストが容易
- 外部からのアクセスが必要

**本番環境: 必要に応じて設定**
- セキュリティ要件に応じて設定

## 確認方法

### 1. 環境変数の確認

Vercel Dashboardで確認：
- `VITE_API_BASE_URL`が設定されていないか、空であることを確認

### 2. コードの確認

現在のコードは既に相対パスに対応しています：
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
// 空の場合は相対パス（/api/...）を使用
```

### 3. テスト

設定変更後、以下をテスト：
1. Preview環境で決済を試す
2. Production環境で決済を試す
3. 両方で401エラーとCORSエラーが解消されることを確認

