# Stripe Connect 連結アカウント オンボーディングガイド

## 現在の状況

- **アカウントID**: `acct_1SmtPlHk8MTQ5wk4`
- **タイプ**: なし（Standardアカウントとして作成する必要があります）
- **規約への同意**: 契約に同意されていません
- **制限**: すべての連結アカウントが制限中

## 問題の解決方法

### 1. 規約への同意とオンボーディングの完了

連結アカウントが使用可能になるには、以下が必要です：

1. **規約への同意**
2. **必要な情報の提供**（ビジネス情報、銀行口座情報など）
3. **オンボーディングの完了**

### 2. アカウントリンクの作成

Stripe Connectでは、**Account Link**を作成して、連結アカウントのオーナーにオンボーディングを完了してもらう必要があります。

#### 手動でアカウントリンクを作成する方法

1. **Stripe Dashboard**にログイン
2. **Connect > Accounts** に移動
3. 連結アカウント（`acct_1SmtPlHk8MTQ5wk4`）を選択
4. **「Get account link」**または**「Complete onboarding」**をクリック
5. オンボーディングURLを取得
6. そのURLを連結アカウントのオーナーに送信

#### APIでアカウントリンクを作成する方法

```javascript
// APIエンドポイント: /api/create-account-link
POST /api/create-account-link
{
  "accountId": "acct_1SmtPlHk8MTQ5wk4",
  "refreshUrl": "https://your-domain.com/stripe-connect-refresh",
  "returnUrl": "https://your-domain.com/stripe-connect-return"
}
```

### 3. オンボーディングフロー

1. **アカウントリンクを作成**
2. **連結アカウントのオーナーがリンクにアクセス**
3. **規約に同意**
4. **必要な情報を入力**（ビジネス情報、銀行口座情報など）
5. **オンボーディング完了**
6. **制限が解除される**

### 4. 制限解除の確認

オンボーディング完了後、以下を確認してください：

- `charges_enabled`: `true`
- `payouts_enabled`: `true`
- `details_submitted`: `true`
- `restrictions`: 空
- `type`: `standard`（Standardアカウントの場合）

## 実装済みの機能

現在の実装では、以下のAPIエンドポイントが利用可能です：

1. **`/api/create-account-link`**: アカウントリンクを作成
2. **`/api/get-connected-account`**: 連結アカウントの状態を確認
3. **`/api/create-connect-payment-intent`**: 決済Intentを作成（制限解除後）

## 次のステップ

1. **アカウントリンクを作成**（Stripe DashboardまたはAPI）
2. **連結アカウントのオーナーにオンボーディングを完了してもらう**
3. **制限解除を確認**
4. **決済を試す**

## 注意事項

- 連結アカウントIDが変更された場合、コード内のIDも更新する必要があります
- 現在のコードでは `acct_1SmtPlHk8MTQ5wk4` を使用するように更新済みです
- 規約への同意とオンボーディングの完了は、連結アカウントのオーナーが行う必要があります

