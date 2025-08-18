-- Customer Statistics View
-- 顧客の統計情報を効率的に取得するためのビュー

CREATE OR REPLACE VIEW customer_statistics AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.address,
    c.birth_date,
    c.gender,
    c.total_points,
    c.total_purchase_amount,
    c.first_purchase_date,
    c.last_purchase_date,
    c.created_at,
    c.updated_at,
    
    -- 過去2ヶ月の購入回数
    COALESCE(recent_purchases.purchase_count, 0) as purchases_last_2_months,
    
    -- 過去1ヶ月の平均購入額
    COALESCE(monthly_stats.avg_purchase_amount, 0) as avg_purchase_last_month,
    
    -- 過去1ヶ月の獲得ポイント
    COALESCE(monthly_stats.points_earned, 0) as points_earned_last_month,
    
    -- 過去1ヶ月の使用ポイント
    COALESCE(monthly_stats.points_used, 0) as points_used_last_month
    
FROM customers c
LEFT JOIN (
    -- 過去2ヶ月の購入回数
    SELECT 
        customer_id,
        COUNT(*) as purchase_count
    FROM purchase_history
    WHERE purchase_date >= NOW() - INTERVAL '2 months'
    GROUP BY customer_id
) recent_purchases ON c.id = recent_purchases.customer_id

LEFT JOIN (
    -- 過去1ヶ月の統計情報
    SELECT 
        customer_id,
        AVG(total_amount) as avg_purchase_amount,
        SUM(points_earned) as points_earned,
        SUM(points_used) as points_used
    FROM purchase_history
    WHERE purchase_date >= NOW() - INTERVAL '1 month'
    GROUP BY customer_id
) monthly_stats ON c.id = monthly_stats.customer_id

ORDER BY c.last_purchase_date DESC NULLS LAST;

-- ビューの権限設定
GRANT SELECT ON customer_statistics TO authenticated;

-- ビューの説明
COMMENT ON VIEW customer_statistics IS '顧客の統計情報を表示するビュー。過去2ヶ月の購入回数、過去1ヶ月の平均購入額、ポイント獲得・使用状況を含む。';
