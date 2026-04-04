# DBW 企業ランディングページ

87app とは別のリポジトリ・別デプロイ用の **単一ページサイト** です。React（Vite）でビルドします。

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

`.github/workflows/*.yml` を **git push で送る**には、クラシック PAT に **`workflow`** スコープが必要です。権限を付けたくない場合は、**このリポジトリにはワークフローファイルを含めず**、上記のとおり GitHub 上でワークフローを新規作成して貼り付けてください。

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
