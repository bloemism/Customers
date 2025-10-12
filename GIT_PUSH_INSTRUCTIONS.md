# Git Push手順

## 現在の状況

コミット済み：29ファイル、4148行追加

```
[main ce27141] Stripe Connect機能実装とテストモード決済完成
 29 files changed, 4148 insertions(+), 618 deletions(-)
```

---

## プッシュ方法

### 方法1: GitHubパーソナルアクセストークン（推奨）

#### 1. トークンを作成

1. **GitHubにアクセス**
   https://github.com/settings/tokens

2. **「Generate new token (classic)」をクリック**

3. **設定**
   - Note: `customers-deploy`
   - Expiration: `90 days`
   - Scopes: ✅ `repo`（すべてにチェック）

4. **「Generate token」をクリック**

5. **トークンをコピー**（`ghp_...`で始まる文字列）

#### 2. プッシュ

```bash
cd /Users/user/customers
git push https://ghp_YOUR_TOKEN_HERE@github.com/bloemism/Customers.git main
```

**または**

```bash
cd /Users/user/customers
git remote set-url origin https://ghp_YOUR_TOKEN_HERE@github.com/bloemism/Customers.git
git push origin main
```

---

### 方法2: SSH鍵を設定

#### 1. SSH鍵を生成

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Enterを3回押す（デフォルト設定）
```

#### 2. 公開鍵をコピー

```bash
cat ~/.ssh/id_ed25519.pub
```

#### 3. GitHubに登録

1. https://github.com/settings/keys
2. 「New SSH key」をクリック
3. Title: `MacBook Air`
4. Key: コピーした公開鍵を貼り付け
5. 「Add SSH key」をクリック

#### 4. リモートURLを変更

```bash
cd /Users/user/customers
git remote set-url origin git@github.com:bloemism/Customers.git
```

#### 5. known_hostsに追加

```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

#### 6. プッシュ

```bash
git push origin main
```

---

### 方法3: GitHub Desktopアプリ（最も簡単）

1. **GitHub Desktopをインストール**
   https://desktop.github.com/

2. **アプリでリポジトリを開く**
   - File → Add Local Repository
   - `/Users/user/customers`を選択

3. **プッシュボタンをクリック**

---

## 推奨方法

**方法1（パーソナルアクセストークン）** が最も簡単で確実です。

1. GitHubでトークンを生成
2. トークンを使ってプッシュ
3. 完了！

---

## 変更内容サマリー

### 新規ファイル (21)
- .cursorrules
- Stripe Connect API (3ファイル)
- Stripe Connect UI (4ファイル)
- ドキュメント (13ファイル)

### 変更ファイル (8)
- .env
- api/create-payment-intent.js
- api/stripe-webhook.js
- src/App.tsx
- src/pages/DynamicStripeCheckout.tsx
- src/services/stripeConnectService.ts
- supabase/stripe_connect_setup.sql
- vercel.json

---

GitHubパーソナルアクセストークンを作成してプッシュしてください！


