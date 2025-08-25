-- 人気ランキングシステムのセットアップ

-- 月次ランキング集計用ビュー
CREATE OR REPLACE VIEW monthly_rankings AS
SELECT 
  EXTRACT(YEAR FROM ph.purchase_date) || '-' || CASE WHEN EXTRACT(MONTH FROM ph.purchase_date) < 10 THEN '0' || EXTRACT(MONTH FROM ph.purchase_date)::text ELSE EXTRACT(MONTH FROM ph.purchase_date)::text END as month,
  c.id as customer_id,
  c.name as customer_name,
  c.total_points,
  COALESCE(s.name, '不明') as store_name,
  COALESCE(s.address, '不明') as store_address,
  COUNT(ph.id) as purchase_count,
  COALESCE(SUM(ph.total_amount), 0) as total_amount,
  COALESCE(AVG(ph.total_amount), 0) as avg_amount,
  COALESCE(SUM(ph.points_used), 0) as total_points_used,
  COALESCE(SUM(ph.points_earned), 0) as total_points_earned
FROM customers c
LEFT JOIN purchase_history ph ON c.id = ph.customer_id
LEFT JOIN stores s ON c.store_id = s.id
GROUP BY EXTRACT(YEAR FROM ph.purchase_date), EXTRACT(MONTH FROM ph.purchase_date), c.id, c.name, c.total_points, s.name, s.address;

-- ポイント使用ランキング用ビュー
CREATE OR REPLACE VIEW points_used_rankings AS
SELECT 
  EXTRACT(YEAR FROM ph.purchase_date) || '-' || CASE WHEN EXTRACT(MONTH FROM ph.purchase_date) < 10 THEN '0' || EXTRACT(MONTH FROM ph.purchase_date)::text ELSE EXTRACT(MONTH FROM ph.purchase_date)::text END as month,
  c.id as customer_id,
  c.name as customer_name,
  COALESCE(s.name, '不明') as store_name,
  COALESCE(s.address, '不明') as store_address,
  COALESCE(SUM(ph.points_used), 0) as total_points_used,
  ROW_NUMBER() OVER (
    PARTITION BY EXTRACT(YEAR FROM ph.purchase_date), EXTRACT(MONTH FROM ph.purchase_date)
    ORDER BY COALESCE(SUM(ph.points_used), 0) DESC
  ) as rank
FROM customers c
JOIN purchase_history ph ON c.id = ph.customer_id
LEFT JOIN stores s ON c.store_id = s.id
WHERE ph.points_used > 0
GROUP BY EXTRACT(YEAR FROM ph.purchase_date), EXTRACT(MONTH FROM ph.purchase_date), c.id, c.name, s.name, s.address;

-- 残ポイントランキング用ビュー
CREATE OR REPLACE VIEW remaining_points_rankings AS
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  COALESCE(s.name, '不明') as store_name,
  COALESCE(s.address, '不明') as store_address,
  c.total_points,
  ROW_NUMBER() OVER (ORDER BY c.total_points DESC) as rank
FROM customers c
LEFT JOIN stores s ON c.store_id = s.id
WHERE c.total_points > 0;

-- 平均売上ランキング用ビュー
CREATE OR REPLACE VIEW average_sales_rankings AS
SELECT 
  EXTRACT(YEAR FROM ph.purchase_date) || '-' || CASE WHEN EXTRACT(MONTH FROM ph.purchase_date) < 10 THEN '0' || EXTRACT(MONTH FROM ph.purchase_date)::text ELSE EXTRACT(MONTH FROM ph.purchase_date)::text END as month,
  c.id as customer_id,
  c.name as customer_name,
  COALESCE(s.name, '不明') as store_name,
  COALESCE(s.address, '不明') as store_address,
  COALESCE(AVG(ph.total_amount), 0) as avg_amount,
  ROW_NUMBER() OVER (
    PARTITION BY EXTRACT(YEAR FROM ph.purchase_date), EXTRACT(MONTH FROM ph.purchase_date)
    ORDER BY COALESCE(AVG(ph.total_amount), 0) DESC
  ) as rank
FROM customers c
JOIN purchase_history ph ON c.id = ph.customer_id
LEFT JOIN stores s ON c.store_id = s.id
GROUP BY EXTRACT(YEAR FROM ph.purchase_date), EXTRACT(MONTH FROM ph.purchase_date), c.id, c.name, s.name, s.address;

-- 総売上ランキング用ビュー
CREATE OR REPLACE VIEW total_sales_rankings AS
SELECT 
  EXTRACT(YEAR FROM ph.purchase_date) || '-' || CASE WHEN EXTRACT(MONTH FROM ph.purchase_date) < 10 THEN '0' || EXTRACT(MONTH FROM ph.purchase_date)::text ELSE EXTRACT(MONTH FROM ph.purchase_date)::text END as month,
  c.id as customer_id,
  c.name as customer_name,
  COALESCE(s.name, '不明') as store_name,
  COALESCE(s.address, '不明') as store_address,
  COALESCE(SUM(ph.total_amount), 0) as total_amount,
  ROW_NUMBER() OVER (
    PARTITION BY EXTRACT(YEAR FROM ph.purchase_date), EXTRACT(MONTH FROM ph.purchase_date)
    ORDER BY COALESCE(SUM(ph.total_amount), 0) DESC
  ) as rank
FROM customers c
JOIN purchase_history ph ON c.id = ph.customer_id
LEFT JOIN stores s ON c.store_id = s.id
GROUP BY EXTRACT(YEAR FROM ph.purchase_date), EXTRACT(MONTH FROM ph.purchase_date), c.id, c.name, s.name, s.address;

-- 地域別集計用ビュー
CREATE OR REPLACE VIEW regional_rankings AS
SELECT 
  EXTRACT(YEAR FROM ph.purchase_date) || '-' || CASE WHEN EXTRACT(MONTH FROM ph.purchase_date) < 10 THEN '0' || EXTRACT(MONTH FROM ph.purchase_date)::text ELSE EXTRACT(MONTH FROM ph.purchase_date)::text END as month,
  COALESCE(s.address, '不明') as store_address,
  COUNT(DISTINCT c.id) as customer_count,
  COUNT(ph.id) as purchase_count,
  COALESCE(SUM(ph.total_amount), 0) as total_amount,
  COALESCE(AVG(ph.total_amount), 0) as avg_amount,
  COALESCE(SUM(ph.points_used), 0) as total_points_used,
  COALESCE(SUM(ph.points_earned), 0) as total_points_earned
FROM customers c
JOIN purchase_history ph ON c.id = ph.customer_id
LEFT JOIN stores s ON c.store_id = s.id
GROUP BY EXTRACT(YEAR FROM ph.purchase_date), s.address;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_purchase_history_year_month ON purchase_history(EXTRACT(YEAR FROM purchase_date), EXTRACT(MONTH FROM purchase_date));
CREATE INDEX IF NOT EXISTS idx_purchase_history_customer_date ON purchase_history(customer_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_customers_points ON customers(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_stores_address ON stores(address);

-- 権限設定
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 各ビューに対する権限設定
GRANT SELECT ON monthly_rankings TO authenticated;
GRANT SELECT ON points_used_rankings TO authenticated;
GRANT SELECT ON remaining_points_rankings TO authenticated;
GRANT SELECT ON average_sales_rankings TO authenticated;
GRANT SELECT ON total_sales_rankings TO authenticated;
GRANT SELECT ON regional_rankings TO authenticated;
