# Stripeテストモードへの切り替えガイド

## 問題

Stripe本番環境（Live Mode）では、Connected Accounts機能が制限されています。
- プラットフォーム申請が必要
- 審査・承認が必要
- 承認されるまで使用不可

## 解決策：テストモードで開発

まず、テストモード（Test Mode）で機能を確認してから、本番環境の申請を行います。

---

## テストモードへの切り替え手順

### 1. Stripeテストキーを取得

#### Stripe Dashboardにアクセス
1. https://dashboard.stripe.com/test/apikeys
2. **テストモードに切り替え**（右上のトグルスイッチ）
3. 以下のキーをコピー：
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### 2. Vercelの環境変数を更新

#### Vercel Dashboardで編集
https://vercel.com/bloemisms-projects/customers/settings/environment-variables

以下の環境変数を**テストキー**に変更：

| 変数名 | 現在の値 | 新しい値（テストモード） |
|-------|---------|----------------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_51Rp6qz...` | `pk_test_...`（コピーした値） |
| `STRIPE_SECRET_KEY` | `sk_live_51Rp6qz...` | `sk_test_...`（コピーした値） |

#### 編集方法
1. 各環境変数の「...」→「Edit」をクリック
2. **Value**を新しいテストキーに変更
3. 「Save」をクリック

### 3. 再デプロイ

```bash
cd /Users/user/customers && vercel --prod
```

### 4. テスト

1. デプロイサイトにアクセス
2. 決済コードを入力
3. 決済を実行
4. テストカードで決済：
   - カード番号: `4242 4242 4242 4242`
   - 有効期限: `12/34`
   - CVC: `123`

---

## テストモードとライブモードの違い

| 機能 | テストモード | ライブモード |
|-----|------------|------------|
| **決済** | テストカードのみ | 実際のカード |
| **入金** | 実際の入金なし | 実際の入金あり |
| **Connected Accounts** | 自由に作成可能 | 審査・承認が必要 |
| **手数料** | 発生しない | 実際に発生 |
| **データ** | テストデータ | 本番データ |

---

## 本番環境でConnected Accountsを使用する方法

### Stripe Connectの申請手順

#### 1. プラットフォーム情報の入力

Stripe Dashboardで以下を設定：
1. https://dashboard.stripe.com/settings/connect
2. 「Get started」をクリック
3. プラットフォーム情報を入力：
   - **プラットフォーム名**: `Bloemism 87app`
   - **ビジネスの説明**: `花屋・フラワースクール向け決済プラットフォーム`
   - **ウェブサイトURL**: デプロイサイトのURL
   - **サポートメール**: サポート用メールアドレス

#### 2. 必要書類の提出

- 事業者登録証明書
- 本人確認書類
- 銀行口座情報
- プラットフォームの詳細説明

#### 3. 審査

- Stripeが申請内容を審査
- 通常1〜3営業日
- 追加情報を求められる場合あり

#### 4. 承認後

承認されると、本番環境でConnected Accountsが使用可能になります。

---

## 現在の推奨設定

### 開発・テスト段階
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 本番環境（Stripe Connect承認後）
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51Rp6qz...
STRIPE_SECRET_KEY=sk_live_51Rp6qz...
```

---

## 機能の実装状態

### ✅ 実装済み（テストモードで動作確認可能）
- 決済コードシステム
- Stripe Checkout統合
- 顧客データ管理
- 決済履歴

### ⏸️ 保留中（本番環境の承認待ち）
- Connected Accounts
- 分割決済
- 店舗ダッシュボード
- 自動入金

---

## 次のステップ

### 今すぐできること
1. ✅ **テストモードに切り替え**
2. ✅ **決済フローを完全にテスト**
3. ✅ **バグを修正**

### 本番環境の準備
1. 📝 **Stripe Connectを申請**
2. ⏳ **審査を待つ**（1〜3営業日）
3. ✅ **承認後、本番キーに切り替え**

---

まず、テストモードで完全に動作することを確認してから、本番環境の申請を行うのが安全です！


