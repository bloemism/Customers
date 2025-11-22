-- 顧客向け公開ランキングシステム
-- プライバシーを保護しつつ、地域や品目のトレンドを提供
-- 87app Flower Shop Management System

-- 1. 地域別統計ビュー（都道府県レベル）
CREATE OR REPLACE VIEW regional_statistics_view AS
SELECT 
  CASE 
    WHEN s.address LIKE '%東京都%' THEN '東京都'
    WHEN s.address LIKE '%大阪府%' THEN '大阪府'
    WHEN s.address LIKE '%愛知県%' THEN '愛知県'
    WHEN s.address LIKE '%神奈川県%' THEN '神奈川県'
    WHEN s.address LIKE '%埼玉県%' THEN '埼玉県'
    WHEN s.address LIKE '%千葉県%' THEN '千葉県'
    WHEN s.address LIKE '%兵庫県%' THEN '兵庫県'
    WHEN s.address LIKE '%北海道%' THEN '北海道'
    WHEN s.address LIKE '%福岡県%' THEN '福岡県'
    WHEN s.address LIKE '%静岡県%' THEN '静岡県'
    WHEN s.address LIKE '%茨城県%' THEN '茨城県'
    WHEN s.address LIKE '%広島県%' THEN '広島県'
    WHEN s.address LIKE '%京都府%' THEN '京都府'
    WHEN s.address LIKE '%宮城県%' THEN '宮城県'
    WHEN s.address LIKE '%新潟県%' THEN '新潟県'
    WHEN s.address LIKE '%長野県%' THEN '長野県'
    WHEN s.address LIKE '%岐阜県%' THEN '岐阜県'
    WHEN s.address LIKE '%群馬県%' THEN '群馬県'
    WHEN s.address LIKE '%栃木県%' THEN '栃木県'
    WHEN s.address LIKE '%岡山県%' THEN '岡山県'
    WHEN s.address LIKE '%福島県%' THEN '福島県'
    WHEN s.address LIKE '%三重県%' THEN '三重県'
    WHEN s.address LIKE '%熊本県%' THEN '熊本県'
    WHEN s.address LIKE '%鹿児島県%' THEN '鹿児島県'
    WHEN s.address LIKE '%沖縄県%' THEN '沖縄県'
    ELSE 'その他'
  END as prefecture,
  COUNT(DISTINCT pr.store_id) as store_count,
  COUNT(pr.id) as total_payments,
  ROUND(AVG(pr.total), 0) as average_payment_amount,
  ROUND(SUM(pr.total) / COUNT(DISTINCT pr.store_id), 0) as average_sales_per_store,
  COUNT(DISTINCT pr.customer_id) as unique_customers,
  ROUND(SUM(pr.points_to_use) / NULLIF(COUNT(pr.id), 0), 0) as average_points_used
FROM payment_requests pr
LEFT JOIN stores s ON pr.store_id = s.id
WHERE pr.status = 'completed'
  AND pr.created_at >= CURRENT_DATE - INTERVAL '30 days' -- 直近30日
GROUP BY 
  CASE 
    WHEN s.address LIKE '%東京都%' THEN '東京都'
    WHEN s.address LIKE '%大阪府%' THEN '大阪府'
    WHEN s.address LIKE '%愛知県%' THEN '愛知県'
    WHEN s.address LIKE '%神奈川県%' THEN '神奈川県'
    WHEN s.address LIKE '%埼玉県%' THEN '埼玉県'
    WHEN s.address LIKE '%千葉県%' THEN '千葉県'
    WHEN s.address LIKE '%兵庫県%' THEN '兵庫県'
    WHEN s.address LIKE '%北海道%' THEN '北海道'
    WHEN s.address LIKE '%福岡県%' THEN '福岡県'
    WHEN s.address LIKE '%静岡県%' THEN '静岡県'
    WHEN s.address LIKE '%茨城県%' THEN '茨城県'
    WHEN s.address LIKE '%広島県%' THEN '広島県'
    WHEN s.address LIKE '%京都府%' THEN '京都府'
    WHEN s.address LIKE '%宮城県%' THEN '宮城県'
    WHEN s.address LIKE '%新潟県%' THEN '新潟県'
    WHEN s.address LIKE '%長野県%' THEN '長野県'
    WHEN s.address LIKE '%岐阜県%' THEN '岐阜県'
    WHEN s.address LIKE '%群馬県%' THEN '群馬県'
    WHEN s.address LIKE '%栃木県%' THEN '栃木県'
    WHEN s.address LIKE '%岡山県%' THEN '岡山県'
    WHEN s.address LIKE '%福島県%' THEN '福島県'
    WHEN s.address LIKE '%三重県%' THEN '三重県'
    WHEN s.address LIKE '%熊本県%' THEN '熊本県'
    WHEN s.address LIKE '%鹿児島県%' THEN '鹿児島県'
    WHEN s.address LIKE '%沖縄県%' THEN '沖縄県'
    ELSE 'その他'
  END
ORDER BY total_payments DESC;

-- 2. 品目別人気ランキングビュー（商品名は匿名化）
CREATE OR REPLACE VIEW product_popularity_ranking_view AS
SELECT 
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
  END as flower_category,
  COUNT(*) as popularity_count,
  SUM((item_data->>'quantity')::integer) as total_quantity_sold,
  ROUND(AVG((item_data->>'price')::integer), 0) as average_price,
  ROUND(SUM((item_data->>'price')::integer * (item_data->>'quantity')::integer), 0) as total_revenue
FROM payment_requests pr,
LATERAL jsonb_array_elements(pr.items) as item_data
WHERE pr.status = 'completed'
  AND pr.created_at >= CURRENT_DATE - INTERVAL '30 days' -- 直近30日
GROUP BY 
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
  END
ORDER BY popularity_count DESC;

-- 3. ポイント使用ランキングビュー
CREATE OR REPLACE VIEW points_usage_ranking_view AS
SELECT 
  CASE 
    WHEN pr.points_to_use = 0 THEN 'ポイント未使用'
    WHEN pr.points_to_use <= 100 THEN '1-100ポイント'
    WHEN pr.points_to_use <= 500 THEN '101-500ポイント'
    WHEN pr.points_to_use <= 1000 THEN '501-1000ポイント'
    WHEN pr.points_to_use <= 2000 THEN '1001-2000ポイント'
    ELSE '2000ポイント以上'
  END as points_range,
  COUNT(*) as usage_count,
  ROUND(AVG(pr.total), 0) as average_payment_amount,
  ROUND(AVG(pr.points_to_use), 0) as average_points_used,
  ROUND(SUM(pr.points_to_use) / NULLIF(SUM(pr.total), 0) * 100, 1) as points_usage_percentage
FROM payment_requests pr
WHERE pr.status = 'completed'
  AND pr.created_at >= CURRENT_DATE - INTERVAL '30 days' -- 直近30日
GROUP BY 
  CASE 
    WHEN pr.points_to_use = 0 THEN 'ポイント未使用'
    WHEN pr.points_to_use <= 100 THEN '1-100ポイント'
    WHEN pr.points_to_use <= 500 THEN '101-500ポイント'
    WHEN pr.points_to_use <= 1000 THEN '501-1000ポイント'
    WHEN pr.points_to_use <= 2000 THEN '1001-2000ポイント'
    ELSE '2000ポイント以上'
  END
ORDER BY usage_count DESC;

-- 4. 季節別トレンドビュー
CREATE OR REPLACE VIEW seasonal_trends_view AS
SELECT 
  EXTRACT(MONTH FROM pr.created_at) as month,
  CASE 
    WHEN EXTRACT(MONTH FROM pr.created_at) IN (12, 1, 2) THEN '冬'
    WHEN EXTRACT(MONTH FROM pr.created_at) IN (3, 4, 5) THEN '春'
    WHEN EXTRACT(MONTH FROM pr.created_at) IN (6, 7, 8) THEN '夏'
    WHEN EXTRACT(MONTH FROM pr.created_at) IN (9, 10, 11) THEN '秋'
  END as season,
  COUNT(*) as payment_count,
  ROUND(AVG(pr.total), 0) as average_payment_amount,
  COUNT(DISTINCT pr.customer_id) as unique_customers
FROM payment_requests pr
WHERE pr.status = 'completed'
  AND pr.created_at >= CURRENT_DATE - INTERVAL '365 days' -- 直近1年
GROUP BY EXTRACT(MONTH FROM pr.created_at)
ORDER BY month;

-- 5. 決済方法別トレンドビュー
CREATE OR REPLACE VIEW payment_method_trends_view AS
SELECT 
  pr.payment_method,
  COUNT(*) as usage_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as usage_percentage,
  ROUND(AVG(pr.total), 0) as average_payment_amount,
  ROUND(SUM(pr.total), 0) as total_amount
FROM payment_requests pr
WHERE pr.status = 'completed'
  AND pr.created_at >= CURRENT_DATE - INTERVAL '30 days' -- 直近30日
GROUP BY pr.payment_method
ORDER BY usage_count DESC;

-- 6. 地域別品目人気ランキング関数
CREATE OR REPLACE FUNCTION get_regional_product_ranking(prefecture_param text)
RETURNS TABLE (
  flower_category text,
  popularity_count bigint,
  average_price numeric,
  total_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pprv.flower_category,
    pprv.popularity_count,
    pprv.average_price,
    pprv.total_revenue
  FROM product_popularity_ranking_view pprv
  WHERE pprv.flower_category != 'その他'
  ORDER BY pprv.popularity_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 7. 権限設定（公開ビューのみ）
GRANT SELECT ON regional_statistics_view TO authenticated;
GRANT SELECT ON product_popularity_ranking_view TO authenticated;
GRANT SELECT ON points_usage_ranking_view TO authenticated;
GRANT SELECT ON seasonal_trends_view TO authenticated;
GRANT SELECT ON payment_method_trends_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_regional_product_ranking(text) TO authenticated;

-- 8. 完了メッセージ
SELECT '顧客向け公開ランキングシステムが正常に作成されました。' as message;
