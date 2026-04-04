-- 人気ランキング（月次ビュー）動作確認用サンプル
-- 実行前に stores.id / customers.id を自環境の実IDに差し替えてください。
--
-- 日付は開発マシンの「今年」（例: 2026年）と揃え、先々月・今月タブで見えるようにしています。
--
-- ▼ 重要（公開ランキングビュー）:
--   store_id が「id-」+ 数字のみ（下記例）は ranking_completed_payment_events から除外されます。
--   PopularityRankings / product_popularity_* には載りません。ランキングUIを試す場合は
--   実在する stores の UUID を store_id に使うか、一時的に ranking_store_excluded_from_rankings を調整してください。
-- 87app 向け store_id 例（このままではランキング対象外）:
--   id-1757758560448, id-1758014098193, id-1758083653225, id-1757997379296, id-1757945658926
-- customer_id: customers.id のテキスト（例: a634fd27-35af-4b5e-b1f7-4377b5c7bc4b）
--
-- 投入後:
-- SELECT public.refresh_customer_rankings(2026, 1);
-- SELECT public.refresh_customer_rankings(2026, 2);
-- SELECT public.refresh_customer_rankings(2026, 3);

INSERT INTO payment_requests (
  id, store_id, customer_id, customer_name, customer_email,
  items, total, points_to_use, payment_method, status, created_at
) VALUES
  (gen_random_uuid(), 'id-1757758560448', 'REPLACE_CUSTOMER_UUID', 'サンプル', 'sample-rankings@example.com',
   '[{"name":"バラブーケ","quantity":2,"price":3500}]'::jsonb, 7000, 500, 'stripe_connect', 'completed',
   TIMESTAMPTZ '2026-03-05 12:00:00+09'),
  (gen_random_uuid(), 'id-1758014098193', 'REPLACE_CUSTOMER_UUID', 'サンプル', 'sample-rankings@example.com',
   '[{"name":"チューリップ鉢植え","quantity":1,"price":2800},{"name":"カーネーション花束","quantity":1,"price":2200}]'::jsonb, 5000, 0, 'stripe_connect', 'completed',
   TIMESTAMPTZ '2026-03-12 15:30:00+09'),
  (gen_random_uuid(), 'id-1758083653225', 'REPLACE_CUSTOMER_UUID', 'サンプル', 'sample-rankings@example.com',
   '[{"name":"ひまわりアレンジ","quantity":3,"price":900}]'::jsonb, 2700, 150, 'cash', 'completed',
   TIMESTAMPTZ '2026-03-18 09:00:00+09'),
  (gen_random_uuid(), 'id-1757758560448', 'REPLACE_CUSTOMER_UUID', 'サンプル', 'sample-rankings@example.com',
   '[{"name":"ユリ花束","quantity":1,"price":4500}]'::jsonb, 4500, 1200, 'stripe_connect', 'completed',
   TIMESTAMPTZ '2026-02-08 11:00:00+09'),
  (gen_random_uuid(), 'id-1757997379296', 'REPLACE_CUSTOMER_UUID', 'サンプル', 'sample-rankings@example.com',
   '[{"name":"観葉植物モンステラ","quantity":1,"price":6800}]'::jsonb, 6800, 300, 'stripe_connect', 'completed',
   TIMESTAMPTZ '2026-02-14 14:00:00+09'),
  (gen_random_uuid(), 'id-1758014098193', 'REPLACE_CUSTOMER_UUID', 'サンプル', 'sample-rankings@example.com',
   '[{"name":"ガーベラブーケ","quantity":2,"price":1800}]'::jsonb, 3600, 50, 'cash', 'completed',
   TIMESTAMPTZ '2026-02-22 16:45:00+09'),
  (gen_random_uuid(), 'id-1758083653225', 'REPLACE_CUSTOMER_UUID', 'サンプル', 'sample-rankings@example.com',
   '[{"name":"バラ","quantity":5,"price":600}]'::jsonb, 3000, 0, 'stripe_connect', 'completed',
   TIMESTAMPTZ '2026-01-10 10:00:00+09'),
  (gen_random_uuid(), 'id-1757758560448', 'REPLACE_CUSTOMER_UUID', 'サンプル', 'sample-rankings@example.com',
   '[{"name":"アレンジメント春","quantity":1,"price":12000}]'::jsonb, 12000, 2000, 'stripe_connect', 'completed',
   TIMESTAMPTZ '2026-01-20 13:20:00+09'),
  (gen_random_uuid(), 'id-1757945658926', 'REPLACE_CUSTOMER_UUID', 'サンプル', 'sample-rankings@example.com',
   '[{"name":"コサージュ","quantity":4,"price":800}]'::jsonb, 3200, 100, 'cash', 'completed',
   TIMESTAMPTZ '2026-01-28 18:00:00+09');
