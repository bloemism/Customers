# 決済レジャー（一本化パイプライン）

## 正（single source of truth）

**`customer_payments` に `status = 'completed'` の行が入ること**が正です。アプリ・Webhook はここへ **1 行 INSERT**（または `pending` → `completed` の **UPDATE**）に集中します。

## DB 側の自動反映

`supabase/customer_payment_ledger_trigger.sql` の **`apply_customer_payment_ledger`** が、完了行ごとに **一度だけ**（`ledger_applied_at` で冪等）次を実行します。

- `point_history` … 付与・利用（理由に `[cp_ledger:<customer_payments.id>]`）
- `customers` … `points` / `total_points` / 購入累計 / `last_purchase_date`

## ページ・月次・ランキング

- 顧客画面・履歴は **`point_history` / `customers`**（トリガー更新後）を参照
- 月次 KPI・ランキング用ビューは **`customer_payments`（および既存の統合ビュー）** を参照  
  例: `supabase/popularity_rankings_monthly_views.sql` の `ranking_completed_payment_events` 系

## アプリ側でやらないこと

- 決済完了後に **`point_history` を直接 INSERT** しない
- 決済完了後に **`customers` のポイントだけを直接 UPDATE** しない（二重計上の原因）

## 運用上の注意

- **同一決済で `customer_payments` を二重 INSERT** しない（Webhook とクライアントの両方で completed を書く等）
- 本番で **`customer_payment_ledger_trigger.sql` を未適用のまま** アプリの直書きだけを消すと、ポイントが付きません
