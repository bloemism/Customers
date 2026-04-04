# DBW 企業ランディングページ

87app とは別のリポジトリ・別デプロイ用の **単一ページサイト** です。React（Vite）でビルドします。

## 全体像（ここがわかると迷子になりにくい）

| こと | 使うもの | SSH 関係 |
|------|----------|----------|
| コードを GitHub に送る（`git push`） | あなたの PC の **git** | **SSH または HTTPS** のどちらかで認証 |
| サイトを見る（訪問者） | ブラウザ → `https://bloemism.github.io/DBW/` | **SSH は使わない**（HTTPS のみ） |
| 本番のファイルを作る | **GitHub Actions** が `npm run build` → `dist` | なし（GitHub 内で完結） |

「デプロイできている」のに画面がおかしかった時期は、**Pages のソースが “ブランチのルート” になっていて、ビルド前の `index.html`（`/src/main.tsx` を読む開発用）が配信されていた**ことがありました。**Source を GitHub Actions にし、ワークフローで `dist` を載せる**と、`/DBW/assets/*.js` 付きの本番 HTML になります。

### SSH で `Permission denied (publickey)` のとき

GitHub が **あなたの PC の中を検索して鍵を探すことはありません。** 鍵のペアは **あなたの Mac で作り、公開鍵だけを GitHub のアカウント設定に登録**します。

- 手順の公式ドキュメント: [SSH で GitHub に接続する](https://docs.github.com/ja/authentication/connecting-to-github-with-ssh)
- 動作確認: `ssh -T git@github.com`（成功すると `Hi ...!` のような返答）
- SSH を使わない選択肢: リモートを `https://github.com/bloemism/DBW.git` にし、**Personal Access Token** で `git push`（トークンに `workflow` が必要なのは **`.github/workflows/` を push で更新するときだけ**）

### 本番が正しく配信されているかの見分け方

ローカルまたはターミナルで:

```bash
curl -s https://bloemism.github.io/DBW/ | grep script
```

- **良い例:** `src="/DBW/assets/index-….js"` のように **`assets` 配下の js**
- **悪い例:** `src="/src/main.tsx"` → まだ **ビルド前の HTML が配信されている**（Pages の Source または Actions を見直す）

## Monorepo（Customers 等）からこのフォルダだけ `bloemism/DBW` へ送る

リポジトリルートで（SSH の例）:

```bash
git push origin main
git push dbw dbw-split-export:main
```

`dbw` リモートが無い場合:

```bash
git remote add dbw git@github.com:bloemism/DBW.git
git subtree split --prefix=dbw-lp -b dbw-split-export
git push dbw dbw-split-export:main
```

`dbw-split-export` ブランチは `dbw-lp` のみの履歴です。`dbw-lp` を更新したあとに再度送る場合は、古い `dbw-split-export` を削除してから `subtree split` し直してください。

## 開発

**リポジトリのルートで `npm run dev` しても 87app（ポート 5173）だけが起動します。** DBW のサイトは `dbw-lp` 配下で起動してください。

```bash
cd dbw-lp
npm install
npm run dev
```

ブラウザで **`http://localhost:5174/`** を開きます（`vite.config.ts` の `server.port`）。

表示されない場合は、ターミナルが **`bloemtarot/dbw-lp` にいるか**、5174 を他プロセスが使っていないか確認してください。

## 本番ビルド

```bash
npm run build
```

成果物は `dist/` です。

## GitHub に「このサイトだけ」載せる手順（例）

1. GitHub で **新しい空のリポジトリ** を作成する（例: `dbw-landing`）。
2. この **`dbw-lp` フォルダの中身** をリポジトリのルートに置く（中身ごとコピーするか、`dbw-lp` をルートにリネームして push）。
3. **GitHub Pages（Project site）** で `https://<user>.github.io/<repo>/` に公開する場合、ビルド時に `base` を合わせる必要があります。

   ```bash
   VITE_BASE_PATH=/<リポジトリ名>/ npm run build
   ```

   例: リポジトリ名が `dbw-landing` なら `VITE_BASE_PATH=/dbw-landing/`。

4. リポジトリ **Settings → Pages** で **Source** を **GitHub Actions** にする。
5. **Actions** タブ → **New workflow** → **set up a workflow yourself** を選び、下記 YAML を貼り付けて `main` にコミットする（ブラウザからのコミットなら PAT の `workflow` 権限は不要）。

### Personal Access Token で push するときの注意

`.github/workflows/pages.yml` は **リポジトリに含めておく**と、`main` への push で自動デプロイできます（このファイルを無くすと **その後はデプロイされません**）。

`.github/workflows/*.yml` を **git push で送る・更新する**には、クラシック PAT に **`workflow`** スコープが必要です。SSH で `git push` する場合は通常そのまま送れます。PAT に `workflow` を付けたくない場合は、GitHub 上でワークフローを編集して保存し、**手元の `pages.yml` と内容を揃える**か、あとから `workflow` 付き PAT で一度だけ push してください。

### GitHub Pages 用ワークフロー（貼り付け用）

ファイル名例: `.github/workflows/pages.yml`

```yaml
# Node 20 ランタイム廃止に向けた対応: checkout/setup-node/deploy を Node 24 系に更新
# https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: '24'
          cache: npm
      - run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_BASE_PATH: /${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v5
        id: deployment
```

カスタムドメインでルート配信する場合は `vite.config.ts` の `base` を `'/'` にし、ビルド時は `VITE_BASE_PATH` を指定しなくてよいです。

## 文言・画像の編集

- 文章: `src/content/dbwLandingContent.ts`
- 画像: `public/company/`（同名ファイルを差し替え）
