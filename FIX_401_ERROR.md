# 401エラーの修正方法

## 問題

Supabase認証で401エラーが発生しています：
```
aoqmdyapjsmmvjrwfdup.supabase.co/auth/v1/token?grant_type=password:1 Failed to load resource: the server responded with a status of 401 ()
```

## 原因

`VITE_SUPABASE_URL`が**Production環境に設定されていません**。

現在の設定状態：
```
VITE_SUPABASE_URL: Preview, Development のみ
                    ^^^^^^^^^^^^^^^^^^
                    Production が含まれていない！
```

---

## 修正手順

### 方法1: Vercel Dashboard（推奨）

1. **Vercelダッシュボードにアクセス**
   https://vercel.com/bloemisms-projects/customers/settings/environment-variables

2. **`VITE_SUPABASE_URL`を探す**
   既存の環境変数リストから見つける

3. **環境を編集**
   - 右側の「...」メニューをクリック
   - 「Edit」を選択
   - **Production** にもチェックを入れる
   - 「Save」をクリック

4. **再デプロイ**
   ```bash
   cd /Users/user/customers && vercel --prod
   ```

---

### 方法2: 環境変数を削除して再作成

1. **既存の`VITE_SUPABASE_URL`を削除**
   ```bash
   vercel env rm VITE_SUPABASE_URL production
   vercel env rm VITE_SUPABASE_URL preview
   vercel env rm VITE_SUPABASE_URL development
   ```

2. **全環境に追加**
   Vercel Dashboardで新規追加：
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://aoqmdyapjsmmvjrwfdup.supabase.co`
   - Environment: **Production, Preview, Development** (すべてチェック)

3. **再デプロイ**
   ```bash
   vercel --prod
   ```

---

## 確認方法

### 1. 環境変数の確認
```bash
vercel env ls
```

**正しい状態:**
```
VITE_SUPABASE_URL    Encrypted    Production, Preview, Development
                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                  すべての環境にチェック
```

### 2. デプロイサイトで確認

ブラウザの開発者ツールで確認：
```javascript
// Consoleで実行
console.log(import.meta.env.VITE_SUPABASE_URL);
// 結果: "https://aoqmdyapjsmmvjrwfdup.supabase.co"
```

---

## その他の401エラーの可能性

### Supabase Anon Keyが間違っている

**確認:**
1. Supabaseダッシュボード: https://supabase.com/dashboard/project/aoqmdyapjsmmvjrwfdup/settings/api
2. 「anon public」キーをコピー
3. Vercelの`VITE_SUPABASE_ANON_KEY`と一致しているか確認

### ユーザー認証情報が間違っている

- メールアドレスが正しいか
- パスワードが正しいか
- ユーザーがSupabaseに存在するか

**確認方法:**
Supabaseダッシュボード → Authentication → Users

---

## デプロイ後のテスト

1. **デプロイサイトにアクセス**
   https://customers-three-rust.vercel.app

2. **ログインを試す**
   - メールアドレス: （テストユーザー）
   - パスワード: （テストパスワード）

3. **エラーが消えているか確認**
   - ブラウザの開発者ツール → Console
   - 401エラーが表示されないことを確認

---

## 現在のデプロイURL

- **最新**: https://customers-2h6gf1t5a-bloemisms-projects.vercel.app
- **本番**: https://customers-three-rust.vercel.app

---

## 次のステップ

1. ✅ Vercel Dashboardで`VITE_SUPABASE_URL`をProduction環境に追加
2. ✅ 再デプロイ実行
3. ✅ デプロイサイトでログインテスト
4. ✅ 401エラーが解消されたことを確認

Vercel Dashboardで環境変数を修正してから、再デプロイしてください！


