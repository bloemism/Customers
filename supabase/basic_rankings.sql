-- 基本的な人気ランキングシステム

-- 1. ポイント使用ランキング（月次）
CREATE OR REPLACE VIEW monthly_points_used_ranking AS
SELECT 
  DATE_PART('year', ph.purchase_date) as year,
  DATE_PART('month', ph.purchase_date) as month,
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  SUM(ph.points_used) as total_points_used,
  ROW_NUMBER() OVER (
    PARTITION BY DATE_PART('year', ph.purchase_date), DATE_PART('month', ph.purchase_date)
    ORDER BY SUM(ph.points_used) DESC
  ) as rank
FROM customers c
JOIN purchase_history ph ON c.id = ph.customer_id
WHERE ph.points_used > 0
GROUP BY DATE_PART('year', ph.purchase_date), DATE_PART('month', ph.purchase_date), c.id, c.name, c.email;

-- 2. 残ポイントランキング（現在）
CREATE OR REPLACE VIEW current_points_ranking AS
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  c.total_points,
  ROW_NUMBER() OVER (ORDER BY c.total_points DESC) as rank
FROM customers c
WHERE c.total_points > 0;

-- 3. 月次売上ランキング（総額）
CREATE OR REPLACE VIEW monthly_sales_ranking AS
SELECT 
  DATE_PART('year', ph.purchase_date) as year,
  DATE_PART('month', ph.purchase_date) as month,
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  SUM(ph.total_amount) as total_sales,
  ROW_NUMBER() OVER (
    PARTITION BY DATE_PART('year', ph.purchase_date), DATE_PART('month', ph.purchase_date)
    ORDER BY SUM(ph.total_amount) DESC
  ) as rank
FROM customers c
JOIN purchase_history ph ON c.id = ph.customer_id
GROUP BY DATE_PART('year', ph.purchase_date), DATE_PART('month', ph.purchase_date), c.id, c.name, c.email;

-- 4. 月次売上ランキング（平均）
CREATE OR REPLACE VIEW monthly_avg_sales_ranking AS
SELECT 
  DATE_PART('year', ph.purchase_date) as year,
  DATE_PART('month', ph.purchase_date) as month,
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  AVG(ph.total_amount) as avg_sales,
  ROW_NUMBER() OVER (
    PARTITION BY DATE_PART('year', ph.purchase_date), DATE_PART('month', ph.purchase_date)
    ORDER BY AVG(ph.total_amount) DESC
  ) as rank
FROM customers c
JOIN purchase_history ph ON c.id = ph.customer_id
GROUP BY DATE_PART('year', ph.purchase_date), DATE_PART('month', ph.purchase_date), c.id, c.name, c.email;

-- 5. 購入回数ランキング（月次）
CREATE OR REPLACE VIEW monthly_purchase_count_ranking AS
SELECT 
  DATE_PART('year', ph.purchase_date) as year,
  DATE_PART('month', ph.purchase_date) as month,
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  COUNT(ph.id) as purchase_count,
  ROW_NUMBER() OVER (
    PARTITION BY DATE_PART('year', ph.purchase_date), DATE_PART('month', ph.purchase_date)
    ORDER BY COUNT(ph.id) DESC
  ) as rank
FROM customers c
JOIN purchase_history ph ON c.id = ph.customer_id
GROUP BY DATE_PART('year', ph.purchase_date), DATE_PART('month', ph.purchase_date), c.id, c.name, c.email;

-- 権限設定
GRANT SELECT ON monthly_points_used_ranking TO authenticated;
GRANT SELECT ON current_points_ranking TO authenticated;
GRANT SELECT ON monthly_sales_ranking TO authenticated;
GRANT SELECT ON monthly_avg_sales_ranking TO authenticated;
GRANT SELECT ON monthly_purchase_count_ranking TO authenticated;
