-- 人気ランキング: 暦月ベースのビュー + customer_rankings 月次リフレッシュ
-- payment_requests + customer_payments（payment_data.items）を統合し stores / customers と結合（個人名・店舗名は公開ビューに含めない）

-- customer_payments に明細 JSON を格納する場合のカラム（未作成環境向け）
ALTER TABLE public.customer_payments
  ADD COLUMN IF NOT EXISTS payment_data JSONB;

-- 都道府県抽出（住所テキスト）
CREATE OR REPLACE FUNCTION public.extract_prefecture_from_address(addr TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN addr IS NULL THEN 'その他'
    WHEN addr LIKE '%東京都%' THEN '東京都'
    WHEN addr LIKE '%大阪府%' THEN '大阪府'
    WHEN addr LIKE '%愛知県%' THEN '愛知県'
    WHEN addr LIKE '%神奈川県%' THEN '神奈川県'
    WHEN addr LIKE '%埼玉県%' THEN '埼玉県'
    WHEN addr LIKE '%千葉県%' THEN '千葉県'
    WHEN addr LIKE '%兵庫県%' THEN '兵庫県'
    WHEN addr LIKE '%北海道%' THEN '北海道'
    WHEN addr LIKE '%福岡県%' THEN '福岡県'
    WHEN addr LIKE '%静岡県%' THEN '静岡県'
    WHEN addr LIKE '%茨城県%' THEN '茨城県'
    WHEN addr LIKE '%広島県%' THEN '広島県'
    WHEN addr LIKE '%京都府%' THEN '京都府'
    WHEN addr LIKE '%宮城県%' THEN '宮城県'
    WHEN addr LIKE '%新潟県%' THEN '新潟県'
    WHEN addr LIKE '%長野県%' THEN '長野県'
    WHEN addr LIKE '%岐阜県%' THEN '岐阜県'
    WHEN addr LIKE '%群馬県%' THEN '群馬県'
    WHEN addr LIKE '%栃木県%' THEN '栃木県'
    WHEN addr LIKE '%岡山県%' THEN '岡山県'
    WHEN addr LIKE '%福島県%' THEN '福島県'
    WHEN addr LIKE '%三重県%' THEN '三重県'
    WHEN addr LIKE '%熊本県%' THEN '熊本県'
    WHEN addr LIKE '%鹿児島県%' THEN '鹿児島県'
    WHEN addr LIKE '%沖縄県%' THEN '沖縄県'
    ELSE 'その他'
  END;
$$;

-- 品目カテゴリ（商品名から）
CREATE OR REPLACE FUNCTION public.normalize_flower_category(item_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN item_name IS NULL THEN 'その他'
    WHEN item_name ILIKE '%バラ%' OR item_name ILIKE '%ローズ%' THEN 'バラ'
    WHEN item_name ILIKE '%チューリップ%' THEN 'チューリップ'
    WHEN item_name ILIKE '%ひまわり%' THEN 'ひまわり'
    WHEN item_name ILIKE '%ユリ%' OR item_name ILIKE '%リリー%' THEN 'ユリ'
    WHEN item_name ILIKE '%カーネーション%' THEN 'カーネーション'
    WHEN item_name ILIKE '%ガーベラ%' THEN 'ガーベラ'
    WHEN item_name ILIKE '%花束%' THEN '花束'
    WHEN item_name ILIKE '%アレンジ%' THEN 'アレンジメント'
    WHEN item_name ILIKE '%鉢植え%' OR item_name ILIKE '%鉢%' THEN '鉢植え'
    WHEN item_name ILIKE '%観葉%' THEN '観葉植物'
    WHEN item_name ILIKE '%ブーケ%' THEN 'ブーケ'
    WHEN item_name ILIKE '%コサージュ%' THEN 'コサージュ'
    ELSE 'その他'
  END;
$$;

-- customer_payments.payment_data から明細配列を取り出す（キー揺れ・文字列JSON・単一オブジェクトに対応）
CREATE OR REPLACE FUNCTION public.coalesce_jsonb_items_from_payment_data(payment_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  cand jsonb;
  txt text;
BEGIN
  IF payment_data IS NULL OR jsonb_typeof(payment_data) <> 'object' THEN
    RETURN '[]'::jsonb;
  END IF;

  IF jsonb_typeof(payment_data->'items') = 'array'
     AND jsonb_array_length(payment_data->'items') > 0 THEN
    RETURN payment_data->'items';
  END IF;

  IF jsonb_typeof(payment_data->'items') = 'object' THEN
    RETURN jsonb_build_array(payment_data->'items');
  END IF;

  IF jsonb_typeof(payment_data->'items') = 'string' THEN
    txt := payment_data->>'items';
    BEGIN
      cand := txt::jsonb;
      IF jsonb_typeof(cand) = 'array' AND jsonb_array_length(cand) > 0 THEN
        RETURN cand;
      END IF;
      IF jsonb_typeof(cand) = 'object' THEN
        RETURN jsonb_build_array(cand);
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;

  IF jsonb_typeof(payment_data->'line_items') = 'array'
     AND jsonb_array_length(payment_data->'line_items') > 0 THEN
    RETURN payment_data->'line_items';
  END IF;

  IF jsonb_typeof(payment_data->'lineItems') = 'array'
     AND jsonb_array_length(payment_data->'lineItems') > 0 THEN
    RETURN payment_data->'lineItems';
  END IF;

  IF jsonb_typeof(payment_data->'storeData') = 'object' THEN
    IF jsonb_typeof(payment_data->'storeData'->'items') = 'array'
       AND jsonb_array_length(payment_data->'storeData'->'items') > 0 THEN
      RETURN payment_data->'storeData'->'items';
    END IF;
  END IF;

  IF jsonb_typeof(payment_data->'store_data') = 'object' THEN
    IF jsonb_typeof(payment_data->'store_data'->'items') = 'array'
       AND jsonb_array_length(payment_data->'store_data'->'items') > 0 THEN
      RETURN payment_data->'store_data'->'items';
    END IF;
  END IF;

  IF jsonb_typeof(payment_data->'qrStoreData') = 'object' THEN
    IF jsonb_typeof(payment_data->'qrStoreData'->'items') = 'array'
       AND jsonb_array_length(payment_data->'qrStoreData'->'items') > 0 THEN
      RETURN payment_data->'qrStoreData'->'items';
    END IF;
  END IF;

  RETURN '[]'::jsonb;
END;
$$;

COMMENT ON FUNCTION public.coalesce_jsonb_items_from_payment_data(jsonb) IS
  'customer_payments.payment_data から品目ランキング用の items 配列を抽出（items / line_items / storeData.items 等）';

-- 明細が空でも決済金額があれば1行のプレースホルダを返す（品目ビューが payment_count と整合するため）
CREATE OR REPLACE FUNCTION public.ranking_items_or_placeholder(items jsonb, payment_total numeric)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN items IS NOT NULL
      AND jsonb_typeof(items) = 'array'
      AND jsonb_array_length(items) > 0
      THEN items
    WHEN payment_total IS NOT NULL AND payment_total > 0 THEN
      jsonb_build_array(
        jsonb_build_object(
          'name', '（明細なし・金額のみ）',
          'quantity', 1,
          'price', payment_total,
          'unit_price', payment_total,
          'total', payment_total
        )
      )
    ELSE '[]'::jsonb
  END;
$$;

COMMENT ON FUNCTION public.ranking_items_or_placeholder(jsonb, numeric) IS
  'items が空で payment_total>0 のとき1行だけ合成し、product_popularity_* ビューに決済が載るようにする';

-- 公開ランキングから除外する店舗（デモ用 id-数字、またはフラグ）
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS exclude_from_public_rankings boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.stores.exclude_from_public_rankings IS
  'true の店舗の決済は ranking_completed_payment_events および派生ビューから除外';

CREATE OR REPLACE FUNCTION public.try_jsonb_numeric(j jsonb, k text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text;
BEGIN
  IF j IS NULL OR k IS NULL OR jsonb_typeof(j) <> 'object' THEN
    RETURN NULL;
  END IF;
  s := trim(BOTH FROM COALESCE(j->>k, ''));
  IF s = '' THEN
    RETURN NULL;
  END IF;
  BEGIN
    RETURN s::numeric;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$$;

-- 明細1行の売上（total / amount / total_price 等 → なければ単価×数量）
CREATE OR REPLACE FUNCTION public.ranking_line_item_revenue(item_data jsonb)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  t numeric;
  q numeric;
  u numeric;
BEGIN
  IF item_data IS NULL OR jsonb_typeof(item_data) <> 'object' THEN
    RETURN 0;
  END IF;

  t := COALESCE(
    NULLIF(public.try_jsonb_numeric(item_data, 'total'), 0::numeric),
    NULLIF(public.try_jsonb_numeric(item_data, 'amount'), 0::numeric),
    NULLIF(public.try_jsonb_numeric(item_data, 'total_price'), 0::numeric),
    NULLIF(public.try_jsonb_numeric(item_data, 'line_total'), 0::numeric)
  );

  IF t IS NOT NULL THEN
    RETURN t;
  END IF;

  q := public.try_jsonb_numeric(item_data, 'quantity');
  IF q IS NULL OR q <= 0 THEN
    q := 1::numeric;
  END IF;

  u := COALESCE(
    NULLIF(public.try_jsonb_numeric(item_data, 'price'), 0::numeric),
    NULLIF(public.try_jsonb_numeric(item_data, 'unit_price'), 0::numeric),
    NULLIF(public.try_jsonb_numeric(item_data, 'unitPrice'), 0::numeric),
    0::numeric
  );

  RETURN u * q;
END;
$$;

COMMENT ON FUNCTION public.ranking_line_item_revenue(jsonb) IS
  '品目ランキング用: 明細JSONの売上（PaymentHistory 等と同様に amount / total_price を考慮）';

CREATE OR REPLACE FUNCTION public.ranking_line_item_quantity_for_ranking(item_data jsonb)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  q numeric;
BEGIN
  IF item_data IS NULL OR jsonb_typeof(item_data) <> 'object' THEN
    RETURN 1::numeric;
  END IF;
  q := public.try_jsonb_numeric(item_data, 'quantity');
  IF q IS NULL OR q <= 0 THEN
    RETURN 1::numeric;
  END IF;
  RETURN q;
END;
$$;

-- サンプル用 store_id（id-1757...）と exclude フラグ店舗を公開ランキングから外す
CREATE OR REPLACE FUNCTION public.ranking_store_excluded_from_rankings(p_store_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    (p_store_id IS NOT NULL AND p_store_id ~ '^id-[0-9]+$')
    OR COALESCE(
      (
        SELECT st.exclude_from_public_rankings
        FROM public.stores st
        WHERE st.id::text = p_store_id
        LIMIT 1
      ),
      false
    );
$$;

COMMENT ON FUNCTION public.ranking_store_excluded_from_rankings(text) IS
  'デモ用 id-数字の store_id、または stores.exclude_from_public_rankings の店舗を true';

-- customer_rankings: 月次スナップショット用カラム
ALTER TABLE public.customer_rankings
  ADD COLUMN IF NOT EXISTS ranking_year INTEGER,
  ADD COLUMN IF NOT EXISTS ranking_month INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS customer_rankings_user_period_uidx
  ON public.customer_rankings (user_id, ranking_year, ranking_month)
  WHERE user_id IS NOT NULL AND ranking_year IS NOT NULL AND ranking_month IS NOT NULL;

-- 完了決済の統一行（全ランキングの単一ソース）
-- payment_requests + customer_payments。同一取引が両方に載ると二重計上 — 運用で片方に寄せるか dedup を検討
-- デモ用 store_id（id-[数字]）と exclude_from_public_rankings は集計から除外（生データ確認はテーブル直接参照）
CREATE OR REPLACE VIEW public.ranking_completed_payment_events AS
SELECT
  ('pr:' || pr.id::text) AS event_key,
  'payment_request'::text AS source,
  pr.created_at,
  pr.store_id::text AS store_id,
  pr.customer_id::text AS customer_id,
  pr.total::numeric AS payment_total,
  COALESCE(pr.points_to_use, 0)::bigint AS points_used,
  COALESCE(pr.payment_method::text, 'unknown') AS payment_method,
  public.ranking_items_or_placeholder(
    CASE WHEN jsonb_typeof(pr.items) = 'array' THEN pr.items ELSE '[]'::jsonb END,
    pr.total::numeric
  ) AS items,
  0::bigint AS points_earned
FROM public.payment_requests pr
WHERE pr.status = 'completed'
  AND NOT public.ranking_store_excluded_from_rankings(pr.store_id::text)

UNION ALL

SELECT
  ('cp:' || cp.id::text) AS event_key,
  'customer_payment'::text AS source,
  cp.created_at,
  cp.store_id::text AS store_id,
  COALESCE(NULLIF(cp.customer_id::text, ''), cp.user_id::text) AS customer_id,
  cp_tot.payment_total,
  COALESCE(cp.points_used, cp.points_spent, 0)::bigint AS points_used,
  COALESCE(cp.payment_method::text, 'unknown') AS payment_method,
  public.ranking_items_or_placeholder(
    public.coalesce_jsonb_items_from_payment_data(cp.payment_data),
    cp_tot.payment_total
  ) AS items,
  COALESCE(cp.points_earned, 0)::bigint AS points_earned
FROM public.customer_payments cp
CROSS JOIN LATERAL (
  SELECT COALESCE(
    NULLIF(cp.amount::numeric, 0),
    NULLIF((cp.payment_data->>'totalAmount')::numeric, 0),
    NULLIF((cp.payment_data->>'subtotal')::numeric, 0),
    0::numeric
  ) AS payment_total
) AS cp_tot
WHERE cp.status = 'completed'
  AND NOT public.ranking_store_excluded_from_rankings(cp.store_id::text);

-- 公開集計ビューが customer_payments の RLS（本人のみ SELECT）に引っ張られないよう、
-- ベースビューだけ定義者権限で評価する（PII は集計に出さない前提）。
ALTER VIEW public.ranking_completed_payment_events SET (security_invoker = false);

-- 月次KPI（PII なし）
CREATE OR REPLACE VIEW public.payment_monthly_kpis_view AS
SELECT
  EXTRACT(YEAR FROM e.created_at)::INTEGER AS year,
  EXTRACT(MONTH FROM e.created_at)::INTEGER AS month,
  COUNT(*)::BIGINT AS payment_count,
  COALESCE(SUM(e.payment_total), 0)::BIGINT AS total_revenue,
  COALESCE(SUM(e.points_used), 0)::BIGINT AS total_points_used,
  COUNT(DISTINCT e.customer_id)::BIGINT AS unique_customers,
  COALESCE(SUM(e.points_earned), 0)::BIGINT AS total_points_earned,
  COALESCE(SUM(COALESCE(e.points_used, 0) + COALESCE(e.points_earned, 0)), 0)::BIGINT AS total_points_activity,
  COALESCE(SUM(e.payment_total::numeric + COALESCE(e.points_used, 0)::numeric), 0)::BIGINT AS total_gross_sales_yen
FROM public.ranking_completed_payment_events e
GROUP BY 1, 2;

-- 品目 × 月: 本数・明細行数・売上は「決済額+利用ポイント(1pt=1円)」を明細の金額比で按分（ポイント控除前の売上相当）
CREATE OR REPLACE VIEW public.product_popularity_by_month_view AS
WITH event_lines AS (
  SELECT
    e.event_key,
    e.created_at,
    e.payment_total,
    e.points_used,
    item_data,
    public.ranking_line_item_revenue(item_data) AS line_rev,
    public.ranking_line_item_quantity_for_ranking(item_data) AS line_qty
  FROM public.ranking_completed_payment_events e
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(e.items) = 'array' THEN e.items ELSE '[]'::jsonb END
  ) AS item_data
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
  EXTRACT(YEAR FROM a.created_at)::INTEGER AS year,
  EXTRACT(MONTH FROM a.created_at)::INTEGER AS month,
  public.normalize_flower_category(a.item_data->>'name') AS flower_category,
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
GROUP BY 1, 2, 3;

-- 商品名（items の name / item_name の原文）× 月 — カテゴリ正規化なし（売上は決済+pt按分）
CREATE OR REPLACE VIEW public.product_popularity_by_name_month_view AS
WITH event_lines AS (
  SELECT
    e.event_key,
    e.created_at,
    e.payment_total,
    e.points_used,
    item_data,
    public.ranking_line_item_revenue(item_data) AS line_rev,
    public.ranking_line_item_quantity_for_ranking(item_data) AS line_qty
  FROM public.ranking_completed_payment_events e
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(e.items) = 'array' THEN e.items ELSE '[]'::jsonb END
  ) AS item_data
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
  EXTRACT(YEAR FROM a.created_at)::INTEGER AS year,
  EXTRACT(MONTH FROM a.created_at)::INTEGER AS month,
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
GROUP BY 1, 2, 3;

-- flower_item_categories（有効マスタ）と明細名を正規化一致させ、全国で明細が2行以上「被った」商品名のみ月次ランキング
CREATE OR REPLACE VIEW public.product_popularity_overlap_by_name_month_view AS
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
    e.created_at,
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
  WHERE TRIM(BOTH FROM COALESCE(item_data->>'name', item_data->>'item_name', '')) <> ''
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
  EXTRACT(YEAR FROM a.created_at)::integer AS year,
  EXTRACT(MONTH FROM a.created_at)::integer AS month,
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
GROUP BY 1, 2, cn.norm_name
HAVING COUNT(*) >= 2;

-- 地域（都道府県）× 月 のポイント合計
CREATE OR REPLACE VIEW public.regional_points_by_month_view AS
SELECT
  EXTRACT(YEAR FROM e.created_at)::INTEGER AS year,
  EXTRACT(MONTH FROM e.created_at)::INTEGER AS month,
  public.extract_prefecture_from_address(s.address) AS prefecture,
  COALESCE(SUM(COALESCE(e.points_used, 0) + COALESCE(e.points_earned, 0)), 0)::BIGINT AS total_points,
  COUNT(*)::BIGINT AS payment_count,
  COALESCE(SUM(e.payment_total), 0)::BIGINT AS total_revenue
FROM public.ranking_completed_payment_events e
LEFT JOIN public.stores s ON s.id::text = e.store_id
GROUP BY 1, 2, 3;

-- 地域（店舗住所から都道府県）× 月 の販売ランキング（現金決済額・ポイント控除前グロス）
CREATE OR REPLACE VIEW public.regional_sales_by_month_view AS
SELECT
  EXTRACT(YEAR FROM e.created_at)::INTEGER AS year,
  EXTRACT(MONTH FROM e.created_at)::INTEGER AS month,
  public.extract_prefecture_from_address(s.address) AS prefecture,
  COUNT(*)::BIGINT AS payment_count,
  COUNT(DISTINCT e.store_id)::BIGINT AS store_count,
  COALESCE(SUM(e.payment_total), 0)::BIGINT AS total_revenue_cash,
  COALESCE(SUM(e.payment_total::numeric + COALESCE(e.points_used, 0)::numeric), 0)::BIGINT AS total_revenue_gross
FROM public.ranking_completed_payment_events e
LEFT JOIN public.stores s ON s.id::text = e.store_id
GROUP BY 1, 2, 3;

COMMENT ON VIEW public.regional_sales_by_month_view IS
  '店舗 stores.address から都道府県を抽出した月次販売集計。total_revenue_gross = 決済額+利用ポイント(1pt=1円)。';

-- ポイント利用帯 × 月（利用＋付与の合算で帯分け — ranking_completed_payment_events 準拠）
CREATE OR REPLACE VIEW public.points_usage_ranking_by_month_view AS
WITH ev AS (
  SELECT
    e.created_at,
    e.payment_total,
    (COALESCE(e.points_used, 0) + COALESCE(e.points_earned, 0))::bigint AS points_activity
  FROM public.ranking_completed_payment_events e
)
SELECT
  EXTRACT(YEAR FROM ev.created_at)::INTEGER AS year,
  EXTRACT(MONTH FROM ev.created_at)::INTEGER AS month,
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
GROUP BY 1, 2, 3;

-- 年×月の季節トレンド（公開用）
CREATE OR REPLACE VIEW public.seasonal_trends_by_year_month_view AS
SELECT
  EXTRACT(YEAR FROM e.created_at)::INTEGER AS year,
  EXTRACT(MONTH FROM e.created_at)::INTEGER AS month,
  CASE
    WHEN EXTRACT(MONTH FROM e.created_at) IN (12, 1, 2) THEN '冬'
    WHEN EXTRACT(MONTH FROM e.created_at) IN (3, 4, 5) THEN '春'
    WHEN EXTRACT(MONTH FROM e.created_at) IN (6, 7, 8) THEN '夏'
    ELSE '秋'
  END AS season,
  COUNT(*)::BIGINT AS payment_count,
  ROUND(AVG(e.payment_total), 0) AS average_payment_amount,
  COUNT(DISTINCT e.customer_id)::BIGINT AS unique_customers
FROM public.ranking_completed_payment_events e
GROUP BY 1, 2, 3;

COMMENT ON VIEW public.ranking_completed_payment_events IS
  '完了決済の統一イベント。全公開ランキング・月次 refresh_customer_rankings の単一ソース。';

-- customer_rankings の RLS 下でも集計だけ返す（SECURITY DEFINER）
CREATE OR REPLACE FUNCTION public.get_customer_rankings_monthly_summary()
RETURNS TABLE (
  year INTEGER,
  month INTEGER,
  ranked_participant_count BIGINT,
  avg_points_among_ranked NUMERIC,
  top_points_value BIGINT,
  top10_slots BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ranking_year AS year,
    ranking_month AS month,
    COUNT(*)::BIGINT AS ranked_participant_count,
    ROUND(AVG(total_points)::NUMERIC, 0) AS avg_points_among_ranked,
    MAX(total_points)::BIGINT AS top_points_value,
    COUNT(*) FILTER (WHERE rank_position IS NOT NULL AND rank_position <= 10)::BIGINT AS top10_slots
  FROM public.customer_rankings
  WHERE ranking_year IS NOT NULL AND ranking_month IS NOT NULL
  GROUP BY ranking_year, ranking_month;
$$;

REVOKE ALL ON FUNCTION public.get_customer_rankings_monthly_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_customer_rankings_monthly_summary() TO authenticated;

-- 月次 customer_rankings: ranking_completed_payment_events のみから集計（利用＋付与）
CREATE OR REPLACE FUNCTION public.refresh_customer_rankings(p_year INTEGER, p_month INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
  v_inserted INTEGER;
BEGIN
  IF p_year IS NULL OR p_month IS NULL OR p_month < 1 OR p_month > 12 THEN
    RETURN json_build_object('success', false, 'error', 'year/month invalid');
  END IF;

  DELETE FROM public.customer_rankings
  WHERE ranking_year = p_year AND ranking_month = p_month;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  INSERT INTO public.customer_rankings (
    user_id, total_points, rank_position, ranking_year, ranking_month, last_updated
  )
  SELECT
    COALESCE(c.user_id, c.id) AS uid,
    LEAST(a.pts, 2147483647)::INTEGER,
    ROW_NUMBER() OVER (ORDER BY a.pts DESC)::INTEGER,
    p_year,
    p_month,
    NOW()
  FROM (
    SELECT
      c.id AS customer_pk,
      SUM(COALESCE(e.points_used, 0) + COALESCE(e.points_earned, 0))::BIGINT AS pts
    FROM public.ranking_completed_payment_events e
    INNER JOIN public.customers c
      ON NULLIF(TRIM(e.customer_id), '') IS NOT NULL
      AND (c.id::text = e.customer_id OR c.user_id::text = e.customer_id)
    WHERE EXTRACT(YEAR FROM e.created_at)::INTEGER = p_year
      AND EXTRACT(MONTH FROM e.created_at)::INTEGER = p_month
    GROUP BY c.id
    HAVING SUM(COALESCE(e.points_used, 0) + COALESCE(e.points_earned, 0)) > 0
  ) a
  INNER JOIN public.customers c ON c.id = a.customer_pk
  WHERE COALESCE(c.user_id, c.id) IS NOT NULL;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'year', p_year,
    'month', p_month,
    'deleted_previous', v_deleted,
    'inserted', v_inserted,
    'source', 'ranking_completed_payment_events'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_customer_rankings(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_customer_rankings(INTEGER, INTEGER) TO service_role;

-- RLS: 本人のみ自分の行を参照（公開ダッシュは summary ビューのみ使用推奨）
ALTER TABLE public.customer_rankings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_rankings_select_own ON public.customer_rankings;
CREATE POLICY customer_rankings_select_own ON public.customer_rankings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 権限（public_ranking_setup.sql と同様、ログイン利用者向け。anon が必要なら追加 GRANT）
GRANT SELECT ON public.ranking_completed_payment_events TO authenticated;
GRANT SELECT ON public.payment_monthly_kpis_view TO authenticated;
GRANT SELECT ON public.product_popularity_by_month_view TO authenticated;
GRANT SELECT ON public.product_popularity_by_name_month_view TO authenticated;
GRANT SELECT ON public.product_popularity_overlap_by_name_month_view TO authenticated;
GRANT SELECT ON public.regional_points_by_month_view TO authenticated;
GRANT SELECT ON public.regional_sales_by_month_view TO authenticated;
GRANT SELECT ON public.points_usage_ranking_by_month_view TO authenticated;
GRANT SELECT ON public.seasonal_trends_by_year_month_view TO authenticated;
