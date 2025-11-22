# Google認証設定ガイド

## 問題の解決方法

Google認証エラー400を解決するために、以下の手順でSupabaseのGoogle認証を設定してください。

## 1. Supabaseダッシュボードでの設定

### ステップ1: 認証プロバイダーの設定
1. [Supabaseダッシュボード](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. 左サイドバーから「Authentication」→「Providers」をクリック
4. 「Google」を探して「Enable」をクリック

### ステップ2: Google OAuth設定
1. Google Cloud ConsoleでOAuth 2.0クライアントIDを作成
2. 認証済みリダイレクトURIに以下を追加：
   ```
   https://aoqmdyapjsmmvjrwfdup.supabase.co/auth/v1/callback
   ```
3. Supabaseダッシュボードで以下を設定：
   - **Client ID**: Google Cloud Consoleから取得
   - **Client Secret**: Google Cloud Consoleから取得

### ステップ3: サイトURLとリダイレクトURLの設定
1. 「Authentication」→「URL Configuration」をクリック
2. 以下を設定：
   - **Site URL**: `http://localhost:5183`
   - **Redirect URLs**: 
     ```
     http://localhost:5183/auth/callback
     https://your-domain.com/auth/callback
     ```

## 2. 環境変数の確認

`.env`ファイルに以下が正しく設定されているか確認：

```env
VITE_SUPABASE_URL=https://aoqmdyapjsmmvjrwfdup.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. アプリケーションの動作確認

1. 開発サーバーを起動：
   ```bash
   npm run dev -- --port 5183
   ```

2. ブラウザで `http://localhost:5183` にアクセス

3. ログイン画面で「Googleでログイン」ボタンをクリック

4. ブラウザの開発者ツール（F12）でコンソールを確認

## 4. トラブルシューティング

### エラー400が発生する場合
- Google OAuth設定でリダイレクトURIが正しく設定されているか確認
- SupabaseのリダイレクトURLに `http://localhost:5183/auth/callback` が追加されているか確認
- Google Cloud ConsoleでOAuth同意画面が正しく設定されているか確認

### エラー500が発生する場合
- SupabaseのClient IDとClient Secretが正しく設定されているか確認
- Google Cloud ConsoleでOAuth 2.0クライアントIDが有効になっているか確認

### その他のエラー
- ブラウザのコンソールで詳細なエラー情報を確認
- Supabaseの認証ログを確認

## 5. 参考リンク

- [Supabase認証ドキュメント](https://supabase.com/docs/guides/auth)
- [Google OAuth設定ガイド](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google認証設定](https://supabase.com/docs/guides/auth/social-login/auth-google)
