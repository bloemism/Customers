-- 決済データをランキングに反映するためのビューと関数
-- 87app Flower Shop Management System

-- 1. 決済データベースのランキングビュー
CREATE OR REPLACE VIEW payment_ranking_view AS
SELECT 
  pr.store_id,
  s.store_name,
  s.address as store_address,
  COUNT(pr.id) as total_payments,
  SUM(pr.total) as total_sales_amount,
  AVG(pr.total) as average_payment_amount,
  COUNT(DISTINCT pr.customer_id) as unique_customers,
  MAX(pr.created_at) as last_payment_date,
  MIN(pr.created_at) as first_payment_date
FROM payment_requests pr
LEFT JOIN stores s ON pr.store_id = s.id
WHERE pr.status = 'completed'
GROUP BY pr.store_id, s.store_name, s.address;

-- 2. 顧客別決済ランキングビュー
CREATE OR REPLACE VIEW customer_payment_ranking_view AS
SELECT 
  pr.customer_id,
  pr.customer_name,
  pr.customer_email,
  COUNT(pr.id) as total_payments,
  SUM(pr.total) as total_spent,
  AVG(pr.total) as average_payment_amount,
  SUM(pr.points_to_use) as total_points_used,
  MAX(pr.created_at) as last_payment_date,
  MIN(pr.created_at) as first_payment_date
FROM payment_requests pr
WHERE pr.status = 'completed'
GROUP BY pr.customer_id, pr.customer_name, pr.customer_email;

-- 3. 月次売上ランキングビュー
CREATE OR REPLACE VIEW monthly_sales_ranking_view AS
SELECT 
  DATE_PART('year', pr.created_at) as year,
  DATE_PART('month', pr.created_at) as month,
  pr.store_id,
  s.store_name,
  COUNT(pr.id) as monthly_payments,
  SUM(pr.total) as monthly_sales,
  AVG(pr.total) as average_payment_amount,
  COUNT(DISTINCT pr.customer_id) as unique_customers
FROM payment_requests pr
LEFT JOIN stores s ON pr.store_id = s.id
WHERE pr.status = 'completed'
GROUP BY DATE_PART('year', pr.created_at), DATE_PART('month', pr.created_at), pr.store_id, s.store_name
ORDER BY year DESC, month DESC, monthly_sales DESC;

-- 4. 商品別売上ランキングビュー
CREATE OR REPLACE VIEW product_sales_ranking_view AS
SELECT 
  item_data->>'name' as product_name,
  pr.store_id,
  s.store_name,
  COUNT(*) as times_sold,
  SUM((item_data->>'quantity')::integer) as total_quantity,
  SUM((item_data->>'price')::integer * (item_data->>'quantity')::integer) as total_revenue,
  AVG((item_data->>'price')::integer) as average_price
FROM payment_requests pr
LEFT JOIN stores s ON pr.store_id = s.id,
LATERAL jsonb_array_elements(pr.items) as item_data
WHERE pr.status = 'completed'
GROUP BY item_data->>'name', pr.store_id, s.store_name
ORDER BY total_revenue DESC;

-- 5. 決済方法別統計ビュー
CREATE OR REPLACE VIEW payment_method_stats_view AS
SELECT 
  pr.payment_method,
  pr.store_id,
  s.store_name,
  COUNT(pr.id) as payment_count,
  SUM(pr.total) as total_amount,
  AVG(pr.total) as average_amount,
  ROUND(COUNT(pr.id) * 100.0 / SUM(COUNT(pr.id)) OVER (PARTITION BY pr.store_id), 2) as percentage
FROM payment_requests pr
LEFT JOIN stores s ON pr.store_id = s.id
WHERE pr.status = 'completed'
GROUP BY pr.payment_method, pr.store_id, s.store_name
ORDER BY pr.store_id, total_amount DESC;

-- 6. 店舗別総合ランキング関数
CREATE OR REPLACE FUNCTION get_store_comprehensive_ranking()
RETURNS TABLE (
  rank bigint,
  store_id text,
  store_name text,
  total_sales bigint,
  total_payments bigint,
  unique_customers bigint,
  average_payment numeric,
  last_payment_date timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY prv.total_sales_amount DESC) as rank,
    prv.store_id,
    prv.store_name,
    prv.total_sales_amount::bigint as total_sales,
    prv.total_payments,
    prv.unique_customers,
    ROUND(prv.average_payment_amount, 2) as average_payment,
    prv.last_payment_date
  FROM payment_ranking_view prv
  ORDER BY prv.total_sales_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. 顧客別総合ランキング関数
CREATE OR REPLACE FUNCTION get_customer_comprehensive_ranking()
RETURNS TABLE (
  rank bigint,
  customer_id text,
  customer_name text,
  total_spent bigint,
  total_payments bigint,
  average_payment numeric,
  total_points_used bigint,
  last_payment_date timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY cprv.total_spent DESC) as rank,
    cprv.customer_id,
    cprv.customer_name,
    cprv.total_spent::bigint as total_spent,
    cprv.total_payments,
    ROUND(cprv.average_payment_amount, 2) as average_payment,
    cprv.total_points_used,
    cprv.last_payment_date
  FROM customer_payment_ranking_view cprv
  ORDER BY cprv.total_spent DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. 月次ランキング関数
CREATE OR REPLACE FUNCTION get_monthly_ranking(year_param integer, month_param integer)
RETURNS TABLE (
  rank bigint,
  store_id text,
  store_name text,
  monthly_sales bigint,
  monthly_payments bigint,
  unique_customers bigint,
  average_payment numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY msrv.monthly_sales DESC) as rank,
    msrv.store_id,
    msrv.store_name,
    msrv.monthly_sales::bigint as monthly_sales,
    msrv.monthly_payments,
    msrv.unique_customers,
    ROUND(msrv.average_payment_amount, 2) as average_payment
  FROM monthly_sales_ranking_view msrv
  WHERE msrv.year = year_param AND msrv.month = month_param
  ORDER BY msrv.monthly_sales DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_payment_requests_store_id ON payment_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_customer_id ON payment_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_requests_total ON payment_requests(total);

-- 10. 権限設定
GRANT SELECT ON payment_ranking_view TO authenticated;
GRANT SELECT ON customer_payment_ranking_view TO authenticated;
GRANT SELECT ON monthly_sales_ranking_view TO authenticated;
GRANT SELECT ON product_sales_ranking_view TO authenticated;
GRANT SELECT ON payment_method_stats_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_store_comprehensive_ranking() TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_comprehensive_ranking() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_ranking(integer, integer) TO authenticated;

-- 11. 完了メッセージ
SELECT '決済データランキングシステムが正常に作成されました。' as message;
