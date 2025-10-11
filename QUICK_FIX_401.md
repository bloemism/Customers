# 401エラー クイック修正方法

## 現在の状況

`VITE_SUPABASE_URL`が**Production環境に設定されていません**。

```
VITE_SUPABASE_URL: Preview, Development のみ
                   Production が含まれていない！←これが原因
```

## 最速の修正方法

### Vercel Dashboardで手動設定（2分で完了）

1. **ブラウザでVercelダッシュボードを開く**
   https://vercel.com/bloemisms-projects/customers/settings/environment-variables

2. **`VITE_SUPABASE_URL`を完全に削除**
   - `VITE_SUPABASE_URL`を見つける
   - 右側の「...」→「Delete」をクリック
   - 確認ダイアログで「Delete」

3. **新しく追加（全環境に設定）**
   - 「Add New」ボタンをクリック
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://aoqmdyapjsmmvjrwfdup.supabase.co`
   - **Environment**: **Production**, **Preview**, **Development** （3つ全てにチェック）
   - 「Save」をクリック

4. **再デプロイ**
   ```bash
   cd /Users/user/customers && vercel --prod
   ```

5. **デプロイサイトで確認**
   新しいURL: https://customers-ftam39aib-bloemisms-projects.vercel.app

---

## 確認方法

### ブラウザの開発者ツールで確認

1. デプロイサイトを開く
2. F12キーで開発者ツールを開く
3. Consoleタブで以下を実行：

```javascript
// 環境変数が正しく読み込まれているか確認
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

**正しい結果:**
```
VITE_SUPABASE_URL: https://aoqmdyapjsmmvjrwfdup.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...
```

**間違っている場合:**
```
VITE_SUPABASE_URL: undefined  ← 環境変数が設定されていない
```

---

## デプロイURL

| 環境 | URL |
|-----|-----|
| 最新デプロイ | https://customers-ftam39aib-bloemisms-projects.vercel.app |
| 本番（メイン） | https://customers-three-rust.vercel.app |

---

## トラブルシューティング

### それでも401エラーが出る場合

1. **ブラウザのキャッシュをクリア**
   - Ctrl+Shift+R（Windows）
   - Cmd+Shift+R（Mac）

2. **シークレットモードで確認**
   - 新しいシークレットウィンドウを開く
   - デプロイサイトにアクセス

3. **環境変数が正しいか再確認**
   ```bash
   vercel env ls
   ```
   
   **正しい状態:**
   ```
   VITE_SUPABASE_URL    Encrypted    Production, Preview, Development
                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                     すべての環境にチェック
   ```

4. **Supabase Anon Keyが正しいか確認**
   - Supabaseダッシュボード: https://supabase.com/dashboard/project/aoqmdyapjsmmvjrwfdup/settings/api
   - 「anon public」キーをコピー
   - Vercelの環境変数と一致しているか確認

---

## 完了後の確認

✅ ログインページでエラーが出ない
✅ 401エラーが表示されない
✅ ログインが成功する
✅ 決済フローが動作する

---

Vercel Dashboardで`VITE_SUPABASE_URL`を削除→再作成（全環境）→再デプロイしてください！

