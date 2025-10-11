# 401エラー デバッグガイド

## 現在の問題

再デプロイしても401エラーが消えません。

## 考えられる原因

### 1. ブラウザのキャッシュ
再デプロイ後、ブラウザが古いバージョンをキャッシュしている可能性があります。

**対処法:**
1. **ハードリロード**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **キャッシュクリア**
   - ブラウザの設定 → プライバシー → キャッシュをクリア

3. **シークレットモード**
   - 新しいシークレットウィンドウで開く
   - キャッシュが影響しない状態でテスト

### 2. 環境変数が間違っている
Supabase Anon Keyが間違っている可能性があります。

**確認方法:**
1. Supabaseダッシュボードにアクセス
   https://supabase.com/dashboard/project/aoqmdyapjsmmvjrwfdup/settings/api

2. 「anon public」キーをコピー

3. Vercelの環境変数と比較

**正しいキー（確認用）:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTY2NTAsImV4cCI6MjA3MDU3MjY1MH0.jPQ4jGvuLDDZ4sFU1sbakWJIRyBKbEkaXsTnirQR4PY
```

### 3. SupabaseのRLS（Row Level Security）
Supabaseのテーブルに適切なアクセス権限が設定されていない可能性があります。

**確認方法:**
1. Supabaseダッシュボード → Authentication → Policies
2. 各テーブル（customers, stores等）のRLSポリシーを確認
3. 公開読み取りまたは認証済みユーザーアクセスが有効か確認

### 4. 認証トークンの有効期限切れ
既存のログインセッションが期限切れの可能性があります。

**対処法:**
1. ログアウト
2. ブラウザのローカルストレージをクリア
   - 開発者ツール → Application → Local Storage → すべてクリア
3. 再度ログイン

---

## 詳細なデバッグ手順

### ステップ1: ブラウザの開発者ツールで確認

1. **デプロイサイトを開く**
   https://customers-g4227f73s-bloemisms-projects.vercel.app

2. **F12キーで開発者ツールを開く**

3. **Networkタブを開く**
   - 「Preserve log」にチェック
   - ページをリロード

4. **401エラーを探す**
   - どのAPIエンドポイントで401が発生しているか確認
   - リクエストURLをメモ

5. **Consoleタブを確認**
   - エラーメッセージを確認
   - スクリーンショットを取る

### ステップ2: 環境変数の値を確認

**Consoleで実行:**
```javascript
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

**正しい結果:**
```
VITE_SUPABASE_URL: https://aoqmdyapjsmmvjrwfdup.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...（長い文字列）
VITE_STRIPE_PUBLISHABLE_KEY: pk_live_51Rp6qz...（長い文字列）
```

**間違っている場合:**
```
VITE_SUPABASE_URL: undefined  ← 環境変数が読み込まれていない
```

### ステップ3: ローカルストレージを確認

**開発者ツール → Application → Local Storage**

1. `supabase.auth.token`を確認
2. トークンが存在するか
3. トークンの有効期限を確認

**削除して再ログイン:**
```javascript
// Consoleで実行
localStorage.clear();
location.reload();
```

### ステップ4: Supabase側の確認

1. **Supabaseダッシュボード → Authentication → Users**
   - ログインしようとしているユーザーが存在するか
   - ユーザーのステータスが「Confirmed」になっているか

2. **Supabaseダッシュボード → Database → Tables**
   - `customers`テーブルにデータが存在するか
   - RLSポリシーが有効になっているか

---

## 即座に試すべきこと

### 1. シークレットモードでテスト
```
1. 新しいシークレットウィンドウを開く
2. デプロイサイトにアクセス
3. ログインを試す
```

### 2. 別のブラウザでテスト
```
Chrome → Firefox や Safari でテスト
```

### 3. 環境変数を再設定
```bash
# Vercel Dashboardで以下を削除→再作成
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# 再デプロイ
vercel --prod
```

---

## どこで401エラーが発生しているか？

### パターン1: ログイン時
```
aoqmdyapjsmmvjrwfdup.supabase.co/auth/v1/token?grant_type=password
```
**原因:** メールアドレスまたはパスワードが間違っている

### パターン2: API呼び出し時
```
aoqmdyapjsmmvjrwfdup.supabase.co/rest/v1/customers?...
```
**原因:** Anon Keyが間違っている、またはRLSポリシーの問題

### パターン3: リフレッシュトークン時
```
aoqmdyapjsmmvjrwfdup.supabase.co/auth/v1/token?grant_type=refresh_token
```
**原因:** セッショントークンの有効期限切れ

---

## 最終手段: 環境変数を完全にリセット

### 手順

1. **Vercel Dashboardで全環境変数を削除**
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - その他すべて

2. **新しく追加（All Environmentsで）**

```
VITE_SUPABASE_URL=https://aoqmdyapjsmmvjrwfdup.supabase.co
VITE_SUPABASE_ANON_KEY=***（Supabaseダッシュボードから取得）
VITE_GOOGLE_MAPS_API_KEY=***（Google Cloud Consoleから取得）
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_***（Stripeダッシュボードから取得）
STRIPE_SECRET_KEY=sk_live_***（Stripeダッシュボードから取得）
SUPABASE_SERVICE_ROLE_KEY=***（Supabaseダッシュボードから取得）
```

3. **再デプロイ**
```bash
vercel --prod
```

4. **ブラウザのキャッシュをクリアしてテスト**

---

## 次のステップ

1. ✅ シークレットモードでテスト
2. ✅ 開発者ツールでエラーの詳細を確認
3. ✅ Supabase Anon Keyを再確認
4. ✅ 環境変数を完全にリセット

どのパターンの401エラーが出ているか教えてください！

