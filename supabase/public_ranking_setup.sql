-- 顧客向け公開ランキングシステム
-- プライバシーを保護しつつ、地域や品目のトレンドを提供
-- 87app Flower Shop Management System
--
-- 前提: popularity_rankings_monthly_views.sql を先に実行し
--       public.ranking_completed_payment_events と extract_prefecture_from_address を作成済みであること

-- 1. 地域別統計ビュー（都道府県レベル）
CREATE OR REPLACE VIEW regional_statistics_view AS
SELECT
  public.extract_prefecture_from_address(s.address) AS prefecture,
  COUNT(DISTINCT e.store_id)::BIGINT AS store_count,
  COUNT(*)::BIGINT AS total_payments,
  ROUND(AVG(e.payment_total), 0) AS average_payment_amount,
  ROUND(SUM(e.payment_total) / NULLIF(COUNT(DISTINCT e.store_id), 0), 0) AS average_sales_per_store,
  COUNT(DISTINCT e.customer_id)::BIGINT AS unique_customers,
  ROUND(
    SUM(COALESCE(e.points_used, 0) + COALESCE(e.points_earned, 0))::NUMERIC / NULLIF(COUNT(*), 0),
    0
  ) AS average_points_used
FROM public.ranking_completed_payment_events e
LEFT JOIN public.stores s ON s.id::text = e.store_id
WHERE e.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1
ORDER BY total_payments DESC;

-- 2. 品目別人気ランキングビュー（カテゴリ集約・売上は決済+利用ptを明細比で按分）
CREATE OR REPLACE VIEW product_popularity_ranking_view AS
WITH event_lines AS (
  SELECT
    e.event_key,
    e.payment_total,
    e.points_used,
    item_data,
    public.ranking_line_item_revenue(item_data) AS line_rev,
    public.ranking_line_item_quantity_for_ranking(item_data) AS line_qty,
    CASE
      WHEN item_data->>'name' LIKE '%バラ%' OR item_data->>'name' LIKE '%ローズ%' THEN 'バラ'
      WHEN item_data->>'name' LIKE '%チューリップ%' THEN 'チューリップ'
      WHEN item_data->>'name' LIKE '%ひまわり%' THEN 'ひまわり'
      WHEN item_data->>'name' LIKE '%ユリ%' OR item_data->>'name' LIKE '%リリー%' THEN 'ユリ'
      WHEN item_data->>'name' LIKE '%カーネーション%' THEN 'カーネーション'
      WHEN item_data->>'name' LIKE '%ガーベラ%' THEN 'ガーベラ'
      WHEN item_data->>'name' LIKE '%花束%' THEN '花束'
      WHEN item_data->>'name' LIKE '%アレンジ%' THEN 'アレンジメント'
      WHEN item_data->>'name' LIKE '%鉢植え%' OR item_data->>'name' LIKE '%鉢%' THEN '鉢植え'
      WHEN item_data->>'name' LIKE '%観葉%' THEN '観葉植物'
      WHEN item_data->>'name' LIKE '%ブーケ%' THEN 'ブーケ'
      WHEN item_data->>'name' LIKE '%コサージュ%' THEN 'コサージュ'
      ELSE 'その他'
    END AS flower_category
  FROM public.ranking_completed_payment_events e
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(e.items) = 'array' THEN e.items ELSE '[]'::jsonb END
  ) AS item_data
  WHERE e.created_at >= CURRENT_DATE - INTERVAL '30 days'
),
weighted AS (
  SELECT
    el.*,
    SUM(el.line_rev) OVER (PARTITION BY el.event_key) AS event_line_rev_sum,
    COUNT(*) OVER (PARTITION BY el.event_key) AS event_line_count
  FROM event_lines el
),
allocated AS (
  SELECT
    w.*,
    CASE
      WHEN w.event_line_rev_sum > 0::numeric THEN
        (w.payment_total::numeric + COALESCE(w.points_used, 0)::numeric)
        * (w.line_rev / w.event_line_rev_sum)
      WHEN w.event_line_count > 0 THEN
        (w.payment_total::numeric + COALESCE(w.points_used, 0)::numeric) / w.event_line_count::numeric
      ELSE 0::numeric
    END AS line_gross_yen
  FROM weighted w
)
SELECT
  a.flower_category,
  COUNT(*)::BIGINT AS popularity_count,
  COALESCE(SUM(a.line_qty), 0)::BIGINT AS total_quantity_sold,
  ROUND(COALESCE(SUM(a.line_gross_yen), 0), 0) AS total_revenue,
  ROUND(
    COALESCE(
      SUM(a.line_gross_yen)::numeric / NULLIF(SUM(a.line_qty), 0)::numeric,
      NULL
    ),
    0
  ) AS average_unit_gross
FROM allocated a
GROUP BY a.flower_category
ORDER BY total_revenue DESC, total_quantity_sold DESC;

-- 2b. 商品名（items.name / item_name の原文）別 — 直近30日（売上は決済+pt按分）
CREATE OR REPLACE VIEW product_popularity_by_name_ranking_view AS
WITH event_lines AS (
  SELECT
    e.event_key,
    e.payment_total,
    e.points_used,
    item_data,
    public.ranking_line_item_revenue(item_data) AS line_rev,
    public.ranking_line_item_quantity_for_ranking(item_data) AS line_qty
  FROM public.ranking_completed_payment_events e
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(e.items) = 'array' THEN e.items ELSE '[]'::jsonb END
  ) AS item_data
  WHERE e.created_at >= CURRENT_DATE - INTERVAL '30 days'
),
weighted AS (
  SELECT
    el.*,
    SUM(el.line_rev) OVER (PARTITION BY el.event_key) AS event_line_rev_sum,
    COUNT(*) OVER (PARTITION BY el.event_key) AS event_line_count
  FROM event_lines el
),
allocated AS (
  SELECT
    w.*,
    CASE
      WHEN w.event_line_rev_sum > 0::numeric THEN
        (w.payment_total::numeric + COALESCE(w.points_used, 0)::numeric)
        * (w.line_rev / w.event_line_rev_sum)
      WHEN w.event_line_count > 0 THEN
        (w.payment_total::numeric + COALESCE(w.points_used, 0)::numeric) / w.event_line_count::numeric
      ELSE 0::numeric
    END AS line_gross_yen
  FROM weighted w
)
SELECT
  COALESCE(
    NULLIF(TRIM(COALESCE(a.item_data->>'name', a.item_data->>'item_name', '')), ''),
    '（名称なし）'
  ) AS item_name,
  COUNT(*)::BIGINT AS popularity_count,
  COALESCE(SUM(a.line_qty), 0)::BIGINT AS total_quantity_sold,
  ROUND(COALESCE(SUM(a.line_gross_yen), 0), 0) AS total_revenue,
  ROUND(
    COALESCE(
      SUM(a.line_gross_yen)::numeric / NULLIF(SUM(a.line_qty), 0)::numeric,
      NULL
    ),
    0
  ) AS average_unit_gross
FROM allocated a
GROUP BY 1
ORDER BY total_revenue DESC, total_quantity_sold DESC;

-- 2c. マスタ名が一致し、直近30日で明細2行以上被った商品名のみ（売上は決済+pt按分）
CREATE OR REPLACE VIEW product_popularity_overlap_by_name_ranking_view AS
WITH flower_catalog_norm AS (
  SELECT
    LOWER(TRIM(BOTH FROM fic.name::text)) AS norm_name,
    MAX(TRIM(BOTH FROM fic.name::text)) AS display_name
  FROM public.flower_item_categories fic
  WHERE fic.is_active = true
    AND TRIM(BOTH FROM fic.name::text) <> ''
  GROUP BY LOWER(TRIM(BOTH FROM fic.name::text))
),
event_lines AS (
  SELECT
    e.event_key,
    e.store_id,
    e.payment_total,
    e.points_used,
    item_data,
    public.ranking_line_item_revenue(item_data) AS line_rev,
    public.ranking_line_item_quantity_for_ranking(item_data) AS line_qty
  FROM public.ranking_completed_payment_events e
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(e.items) = 'array' THEN e.items ELSE '[]'::jsonb END
  ) AS item_data
  INNER JOIN flower_catalog_norm cn0
    ON cn0.norm_name = LOWER(TRIM(BOTH FROM COALESCE(item_data->>'name', item_data->>'item_name', '')))
  WHERE e.created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND TRIM(BOTH FROM COALESCE(item_data->>'name', item_data->>'item_name', '')) <> ''
),
weighted AS (
  SELECT
    el.*,
    SUM(el.line_rev) OVER (PARTITION BY el.event_key) AS event_line_rev_sum,
    COUNT(*) OVER (PARTITION BY el.event_key) AS event_line_count
  FROM event_lines el
),
allocated AS (
  SELECT
    w.*,
    CASE
      WHEN w.event_line_rev_sum > 0::numeric THEN
        (w.payment_total::numeric + COALESCE(w.points_used, 0)::numeric)
        * (w.line_rev / w.event_line_rev_sum)
      WHEN w.event_line_count > 0 THEN
        (w.payment_total::numeric + COALESCE(w.points_used, 0)::numeric) / w.event_line_count::numeric
      ELSE 0::numeric
    END AS line_gross_yen
  FROM weighted w
)
SELECT
  MAX(cn.display_name) AS item_name,
  COUNT(*)::bigint AS popularity_count,
  COUNT(DISTINCT a.store_id)::bigint AS store_count,
  COALESCE(SUM(a.line_qty), 0)::bigint AS total_quantity_sold,
  ROUND(COALESCE(SUM(a.line_gross_yen), 0), 0) AS total_revenue,
  ROUND(
    COALESCE(
      SUM(a.line_gross_yen)::numeric / NULLIF(SUM(a.line_qty), 0)::numeric,
      NULL
    ),
    0
  ) AS average_unit_gross
FROM allocated a
INNER JOIN flower_catalog_norm cn
  ON cn.norm_name = LOWER(TRIM(BOTH FROM COALESCE(a.item_data->>'name', a.item_data->>'item_name', '')))
GROUP BY cn.norm_name
HAVING COUNT(*) >= 2
ORDER BY total_revenue DESC, total_quantity_sold DESC;

-- 3. ポイント帯ランキング（利用＋付与の合算 = ranking_completed_payment_events）
CREATE OR REPLACE VIEW points_usage_ranking_view AS
WITH ev AS (
  SELECT
    e.payment_total,
    (COALESCE(e.points_used, 0) + COALESCE(e.points_earned, 0))::bigint AS points_activity
  FROM public.ranking_completed_payment_events e
  WHERE e.created_at >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
  CASE
    WHEN ev.points_activity = 0 THEN 'ポイント未使用'
    WHEN ev.points_activity <= 100 THEN '1-100ポイント'
    WHEN ev.points_activity <= 500 THEN '101-500ポイント'
    WHEN ev.points_activity <= 1000 THEN '501-1000ポイント'
    WHEN ev.points_activity <= 2000 THEN '1001-2000ポイント'
    ELSE '2000ポイント以上'
  END AS points_range,
  COUNT(*)::BIGINT AS usage_count,
  ROUND(AVG(ev.payment_total), 0) AS average_payment_amount,
  ROUND(AVG(ev.points_activity), 0) AS average_points_used,
  ROUND(SUM(ev.points_activity)::NUMERIC / NULLIF(SUM(ev.payment_total), 0) * 100, 1) AS points_usage_percentage
FROM ev
GROUP BY
  CASE
    WHEN ev.points_activity = 0 THEN 'ポイント未使用'
    WHEN ev.points_activity <= 100 THEN '1-100ポイント'
    WHEN ev.points_activity <= 500 THEN '101-500ポイント'
    WHEN ev.points_activity <= 1000 THEN '501-1000ポイント'
    WHEN ev.points_activity <= 2000 THEN '1001-2000ポイント'
    ELSE '2000ポイント以上'
  END
ORDER BY usage_count DESC;

-- 4. 季節別トレンドビュー
CREATE OR REPLACE VIEW seasonal_trends_view AS
SELECT
  EXTRACT(MONTH FROM e.created_at)::INTEGER AS month,
  CASE
    WHEN EXTRACT(MONTH FROM e.created_at) IN (12, 1, 2) THEN '冬'
    WHEN EXTRACT(MONTH FROM e.created_at) IN (3, 4, 5) THEN '春'
    WHEN EXTRACT(MONTH FROM e.created_at) IN (6, 7, 8) THEN '夏'
    WHEN EXTRACT(MONTH FROM e.created_at) IN (9, 10, 11) THEN '秋'
  END AS season,
  COUNT(*)::BIGINT AS payment_count,
  ROUND(AVG(e.payment_total), 0) AS average_payment_amount,
  COUNT(DISTINCT e.customer_id)::BIGINT AS unique_customers
FROM public.ranking_completed_payment_events e
WHERE e.created_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY
  EXTRACT(MONTH FROM e.created_at),
  CASE
    WHEN EXTRACT(MONTH FROM e.created_at) IN (12, 1, 2) THEN '冬'
    WHEN EXTRACT(MONTH FROM e.created_at) IN (3, 4, 5) THEN '春'
    WHEN EXTRACT(MONTH FROM e.created_at) IN (6, 7, 8) THEN '夏'
    WHEN EXTRACT(MONTH FROM e.created_at) IN (9, 10, 11) THEN '秋'
  END
ORDER BY month;

-- 5. 決済方法別トレンドビュー
CREATE OR REPLACE VIEW payment_method_trends_view AS
SELECT
  e.payment_method,
  COUNT(*)::BIGINT AS usage_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS usage_percentage,
  ROUND(AVG(e.payment_total), 0) AS average_payment_amount,
  ROUND(SUM(e.payment_total), 0) AS total_amount
FROM public.ranking_completed_payment_events e
WHERE e.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.payment_method
ORDER BY usage_count DESC;

-- 6. 品目人気（カテゴリ別・直近30日）
-- prefecture_param は互換のため残すが、現状は未使用（全件ビューから上位のみ）。
-- 以前は flower_category != 'その他' で除外しており、トルコキキョウ等がすべて「その他」だと0件になっていた。
CREATE OR REPLACE FUNCTION get_regional_product_ranking(prefecture_param text)
RETURNS TABLE (
  flower_category text,
  popularity_count bigint,
  total_quantity_sold bigint,
  average_unit_gross numeric,
  total_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pprv.flower_category,
    pprv.popularity_count,
    pprv.total_quantity_sold,
    pprv.average_unit_gross,
    pprv.total_revenue
  FROM product_popularity_ranking_view pprv
  ORDER BY
    CASE WHEN pprv.flower_category = 'その他' THEN 1 ELSE 0 END,
    pprv.total_revenue DESC NULLS LAST,
    pprv.total_quantity_sold DESC NULLS LAST
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 7. 権限設定（公開ビューのみ）
GRANT SELECT ON regional_statistics_view TO authenticated;
GRANT SELECT ON product_popularity_ranking_view TO authenticated;
GRANT SELECT ON product_popularity_by_name_ranking_view TO authenticated;
GRANT SELECT ON product_popularity_overlap_by_name_ranking_view TO authenticated;
GRANT SELECT ON points_usage_ranking_view TO authenticated;
GRANT SELECT ON seasonal_trends_view TO authenticated;
GRANT SELECT ON payment_method_trends_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_regional_product_ranking(text) TO authenticated;

-- 8. 完了メッセージ
SELECT '顧客向け公開ランキングシステムが正常に作成されました。' as message;
