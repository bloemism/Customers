-- ===========================================================================
--  customer_payments.address 追加 + 顧客都道府県別 月次販売ビュー
--  -----------------------------------------------------------------------
--  目的:
--    決済時点のお客さま側の都道府県（customers.address のスナップショット）を
--    customer_payments に保存し、人気ランキングで「お客さまの都道府県別」の
--    集計を出来るようにする。
--
--  安全性方針:
--    - 既存 ranking_completed_payment_events / regional_sales_by_month_view /
--      regional_points_by_month_view 等は変更しない（追加のみ）
--    - customer_payments.address は NULL 許容、既存行は後段の UPDATE で
--      customers.address からバックフィル
--    - 新ビューは既存と同じく security_invoker = false で RLS バイパス
--      （PII を出さない集計のみ。氏名・メール等は含まない）
-- ===========================================================================

-- 1. address カラム追加（既存行は NULL のまま、安全）
ALTER TABLE public.customer_payments
  ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN public.customer_payments.address IS
  '決済時点のお客さま側の都道府県スナップショット（customers.address のコピー）。NULL 許容。';

-- 2. 過去データのバックフィル — customers.address を引いて埋める（NULL のみ更新）
UPDATE public.customer_payments cp
SET address = c.address
FROM public.customers c
WHERE cp.address IS NULL
  AND (
    c.id::text = cp.customer_id
    OR c.user_id::text = cp.user_id
  )
  AND c.address IS NOT NULL
  AND TRIM(c.address) <> '';

-- 3. 都道府県抽出は既存 extract_prefecture_from_address(addr) 関数を再利用
--    （popularity_rankings_monthly_views.sql で定義済み）

-- 4. 新ビュー: お客さまの都道府県別 月次販売
--    -- 既存 stores ベースの regional_sales_by_month_view と並列で利用する想定
--    -- ranking_completed_payment_events は触らず、customer_payments を直接参照
--    -- （customer_payments.address は決済時スナップショットなので、後から
--    --  顧客が引っ越した場合でも当時の都道府県で集計される）
CREATE OR REPLACE VIEW public.customer_regional_sales_by_month_view AS
WITH base AS (
  SELECT
    cp.created_at,
    cp.customer_id,
    cp.user_id,
    cp.store_id,
    COALESCE(
      NULLIF(cp.amount::numeric, 0),
      NULLIF((cp.payment_data->>'totalAmount')::numeric, 0),
      NULLIF((cp.payment_data->>'subtotal')::numeric, 0),
      0::numeric
    ) AS payment_total,
    COALESCE(cp.points_used, cp.points_spent, 0)::bigint AS points_used,
    COALESCE(cp.points_earned, 0)::bigint AS points_earned,
    public.extract_prefecture_from_address(
      COALESCE(NULLIF(TRIM(cp.address), ''), c.address)
    ) AS prefecture
  FROM public.customer_payments cp
  LEFT JOIN public.customers c
    ON (c.id::text = cp.customer_id OR c.user_id::text = cp.user_id)
  WHERE cp.status = 'completed'
    AND NOT public.ranking_store_excluded_from_rankings(cp.store_id::text)
)
SELECT
  EXTRACT(YEAR  FROM b.created_at)::INTEGER AS year,
  EXTRACT(MONTH FROM b.created_at)::INTEGER AS month,
  b.prefecture,
  COUNT(*)::BIGINT AS payment_count,
  COUNT(DISTINCT COALESCE(NULLIF(b.customer_id, ''), b.user_id))::BIGINT AS unique_customers,
  COUNT(DISTINCT b.store_id)::BIGINT AS store_count,
  COALESCE(SUM(b.payment_total), 0)::BIGINT AS total_revenue_cash,
  COALESCE(SUM(b.payment_total + b.points_used::numeric), 0)::BIGINT AS total_revenue_gross,
  COALESCE(SUM(b.points_used + b.points_earned), 0)::BIGINT AS total_points_activity
FROM base b
GROUP BY 1, 2, 3;

-- security_invoker を無効化（既存ランキングビューと同方針 — RLS 越しに集計）
ALTER VIEW public.customer_regional_sales_by_month_view SET (security_invoker = false);

COMMENT ON VIEW public.customer_regional_sales_by_month_view IS
  'お客さまの都道府県（customer_payments.address スナップショット）別 月次販売集計。'
  'PII（氏名・メール等）は含まない。security_invoker = false で RLS 集計バイパス。';

-- 5. 権限（既存ランキングビューと同じく authenticated に SELECT 付与）
GRANT SELECT ON public.customer_regional_sales_by_month_view TO authenticated;

-- ===========================================================================
-- 動作確認（参考）:
--   SELECT * FROM public.customer_regional_sales_by_month_view
--    WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
--      AND month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
--    ORDER BY total_revenue_gross DESC;
-- ===========================================================================
