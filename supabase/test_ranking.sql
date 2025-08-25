-- テスト用：最もシンプルなランキングビュー

-- 残ポイントランキング（最もシンプル）
CREATE OR REPLACE VIEW test_points_ranking AS
SELECT 
  c.id,
  c.name,
  c.total_points,
  ROW_NUMBER() OVER (ORDER BY c.total_points DESC) as rank
FROM customers c
WHERE c.total_points > 0;

-- 権限設定
GRANT SELECT ON test_points_ranking TO authenticated;

