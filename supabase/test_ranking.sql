-- テスト用：最もシンプルなランキングビュー

-- 残ポイントランキング（最もシンプル）
CREATE OR REPLACE VIEW test_points_ranking AS
SELECT 
  c.id,
  c.name,
  COALESCE(c.current_points, c.total_points, 0) as total_points,
  ROW_NUMBER() OVER (ORDER BY COALESCE(c.current_points, c.total_points, 0) DESC) as rank
FROM customers c
WHERE COALESCE(c.current_points, c.total_points, 0) > 0;

-- 権限設定
GRANT SELECT ON test_points_ranking TO authenticated;

