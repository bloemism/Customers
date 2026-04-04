# ランキング集計と月末更新

## 単一ソース: `ranking_completed_payment_events`

**すべての公開ランキング用ビュー**（月次 KPI・品目・県別ポイント・ポイント帯・季節、直近30日の `public_ranking_setup` 系）と **`refresh_customer_rankings`** は、このビューだけを根拠にします。列の追加は **末尾に足す**（PostgreSQL の `CREATE OR REPLACE VIEW` 制約）。

### デモ店舗の除外（`id-数字` とフラグ）

次の決済は **このビューに含まれません**（品目・KPI・地域などすべての派生からも消えます）。

- `store_id` が **`id-` + 数字だけ**（例: `id-1757758560448`）… サンプル・レガシーQR用の文字列ID
- `stores.exclude_from_public_rankings = true` の店舗（実UUID店舗を手動でデモ扱いする場合）

**検証の注意:** `payment_requests` / `customer_payments` を直接足し込んだ金額と、画面上のランキングが一致しないときは、まず除外対象の行が混ざっていないか確認してください。全件を見る場合はテーブルを直接参照します。

### 品目の売上（2行目が0円になる問題）

明細JSONで **`total` / `price` / `unit_price` 以外**に売上がある場合（例: `amount`, `total_price`, `line_total`, `unitPrice`）、以前のビューでは **2行目以降が0円扱い**になり、カテゴリ別 `total_revenue` が小さく見えていました。現在は **`ranking_line_item_revenue()`** で上記キーを順に参照してから単価×数量にフォールバックします。

### 品目ランキングの指標（本数・グロス売上）

品目系ビュー（`product_popularity_by_month_view` 等）の **`total_revenue`** は、決済ごとの **「`payment_total` + 利用ポイント（1pt=1円）」** を、そのカート内の明細の `ranking_line_item_revenue` 比で各行に**按分**した金額の合計です（ポイント控除前の売上相当）。**`total_quantity_sold`** は明細の quantity 合計、**`popularity_count`** は明細行数です。並び順は売上ベースを推奨。**`average_unit_gross`** は 品目内で `total_revenue ÷ total_quantity_sold`（参考）。

### 地域販売（都道府県）

**`regional_sales_by_month_view`** … `store_id` で `stores` に結合し、`stores.address` から **`extract_prefecture_from_address`** で都道府県を出した月次集計。`total_revenue_cash`（決済額合計）、`total_revenue_gross`（決済額＋利用pt）を保持します。

- `points_used` … 決済時の利用ポイント（`payment_requests.points_to_use` / `customer_payments` の利用）
- `points_earned` … **末尾列**。`customer_payments.points_earned`（現金・カード付与）。`payment_requests` 側は `0`

## 人気ランキング（KPI・品目・地域など）

`payment_monthly_kpis_view` や `product_popularity_by_month_view` は **`ranking_completed_payment_events` ビュー**を参照します。このベースビューは `payment_requests` と **`customer_payments`（現金・Stripe など）**を統合しています。

**注意（RLS）:** `customer_payments` は本人のみ SELECT できるポリシーのため、集計ビューが「閲覧者の行だけ」になると全国集計が壊れます。対策として **`ranking_completed_payment_events` に `security_invoker = false`** を設定し、定義者権限で全件を集計対象に含めます（個人情報はビュー側で出さない設計）。

**品目ビューと KPI のズレ:** 月次 KPI は決済 **1 行 = 1 カウント**ですが、`product_popularity_*` は `items` を `jsonb_array_elements` で展開するため、**`payment_data.items` が空**（動的決済でカート0、`payment_data` 未保存の Stripe 履歴など）だと決済はイベントに載っても **品目ランキングに行が増えません**。対策として `ranking_completed_payment_events` では `coalesce_jsonb_items_from_payment_data`（`items` / `line_items` / `storeData.items` 等）で明細を拾い、それでも空なら **`payment_total > 0` のときだけ** 1 行のプレースホルダ「（明細なし・金額のみ）」を付与しています。

`supabase/popularity_rankings_monthly_views.sql` またはマイグレーション `ranking_events_security_invoker_and_refresh_cp_points_earned` を適用済みであることを確認してください。

## `customer_rankings`（月次スナップショット）

このテーブルは **リアルタイムではなく**、関数で都度または定期実行で埋めます。

- **スコア:** `ranking_completed_payment_events` 上で顧客ごとに **`points_used + points_earned`** を月次合算（`refresh_customer_rankings` 内で `customers` と `customer_id` / `user_id` で突合）。
- **実行例（前月を確定したいとき・毎月1日など）:**

```sql
SELECT public.refresh_customer_rankings(
  EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 month'))::integer,
  EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 month'))::integer
);
```

- **service_role のみ** `EXECUTE` 可能です。Supabase SQL Editor ではダッシュボードの「Service role」相当の実行、または Edge Function / バッチから `service_role` キーで RPC を呼び出してください。
- **pg_cron** を有効にしているプロジェクトでは、上記を毎月 1 日 0:05 JST 相当の 1 本のジョブに登録する運用が可能です（未導入の場合は手動または外部スケジューラで可）。

## 関連ファイル

- `supabase/popularity_rankings_monthly_views.sql` — ビュー定義・`refresh_customer_rankings`
- `src/services/publicRankingService.ts` — アプリからの取得
- `src/pages/PopularityRankings.tsx` — 3 ヶ月比較 UI
