# 緊急修正手順

## 問題

1. ブラウザが古いコードをキャッシュしている
2. 古いURL（`customers-three-rust.vercel.app`）を参照している
3. Supabase RLSポリシーの406エラー

---

## 即座の解決策

### ステップ1: ブラウザのキャッシュをクリア

#### 方法A: ハードリロード（最も簡単）
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`

#### 方法B: シークレットモード（確実）
1. 新しいシークレットウィンドウを開く
2. 最新URL にアクセス：
   ```
   https://customers-kz3pf6ep7-bloemisms-projects.vercel.app
   ```

#### 方法C: キャッシュを完全にクリア
1. ブラウザの設定 → プライバシー
2. 「閲覧データを削除」
3. 「キャッシュされた画像とファイル」を選択
4. 「データを削除」

---

### ステップ2: Supabase RLSポリシーを修正

`payment_codes`テーブルで406エラーが出ています。

#### Supabase SQLエディタで実行：

```sql
-- payment_codesテーブルのRLSポリシーを修正
DROP POLICY IF EXISTS "Allow public read access" ON payment_codes;

-- 完全な公開読み取りアクセスを許可
CREATE POLICY "Allow public read access" 
ON payment_codes 
FOR SELECT 
USING (true);

-- 認証済みユーザーの挿入を許可
DROP POLICY IF EXISTS "Allow authenticated insert access" ON payment_codes;
CREATE POLICY "Allow authenticated insert access" 
ON payment_codes 
FOR INSERT 
WITH CHECK (true);

-- 認証済みユーザーの更新を許可
DROP POLICY IF EXISTS "Allow authenticated update access" ON payment_codes;
CREATE POLICY "Allow authenticated update access" 
ON payment_codes 
FOR UPDATE 
USING (true) 
WITH CHECK (true);
```

---

### ステップ3: customer_technical_levelsテーブルの確認

400エラーが出ています。テーブルが存在するか確認：

#### Supabase SQLエディタで実行：

```sql
-- テーブルの存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'customer_technical_levels';

-- テーブルが存在しない場合は作成（または無視）
-- このエラーは決済には影響しないため、一旦無視してOK
```

---

## テスト手順（重要）

### 1. シークレットモードで新しくアクセス

```
1. シークレットウィンドウを開く
2. https://customers-kz3pf6ep7-bloemisms-projects.vercel.app にアクセス
3. ログイン
4. 決済コードを入力
5. 決済を実行
```

### 2. 開発者ツールで確認

- **Network タブ**
- `create-payment-intent`のリクエストURLを確認
- 正しいURL: `https://customers-kz3pf6ep7-bloemisms-projects.vercel.app/api/create-payment-intent`
- 間違ったURL: `https://customers-three-rust.vercel.app/api/create-payment-intent`

---

## 現在の状態

### 環境変数
✅ STRIPE_SECRET_KEY: テストモード（正しい）
✅ VITE_STRIPE_PUBLISHABLE_KEY: テストモード（正しい）
✅ VITE_API_BASE_URL: 空（相対パス）

### デプロイ
✅ 最新コードがデプロイ済み
❌ ブラウザのキャッシュが古いコードを保持

---

## 最も重要

**必ずシークレットモードで新しいURLにアクセスしてください！**

通常モードのブラウザは古いコードをキャッシュしている可能性が非常に高いです。

---

決済テスト前に：
1. ✅ Supabaseで`payment_codes`のRLSポリシーを修正
2. ✅ シークレットモードで新しいURLにアクセス
3. ✅ 決済を実行
4. ✅ エラーが出たら詳細を確認

まず、RLSポリシーを修正してから、シークレットモードでテストしてください！


