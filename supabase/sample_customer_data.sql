-- Sample Customer Data for Testing
-- 顧客管理システムのテスト用サンプルデータ

-- サンプル顧客データの挿入
INSERT INTO customers (name, email, phone, address, birth_date, gender, total_points, total_purchase_amount, first_purchase_date, last_purchase_date) VALUES
('田中 花子', 'tanaka.hanako@example.com', '090-1234-5678', '東京都渋谷区神南1-1-1', '1985-03-15', 'female', 1250, 45000, '2023-01-15 10:30:00', '2024-01-20 14:20:00'),
('佐藤 太郎', 'sato.taro@example.com', '080-2345-6789', '東京都新宿区西新宿2-2-2', '1990-07-22', 'male', 800, 32000, '2023-02-10 11:15:00', '2024-01-18 16:45:00'),
('鈴木 美咲', 'suzuki.misaki@example.com', '070-3456-7890', '東京都港区六本木3-3-3', '1988-11-08', 'female', 2100, 78000, '2022-12-05 09:00:00', '2024-01-22 13:30:00'),
('高橋 健一', 'takahashi.kenichi@example.com', '090-4567-8901', '東京都品川区大井4-4-4', '1982-05-12', 'male', 450, 18000, '2023-06-20 15:10:00', '2024-01-15 12:00:00'),
('伊藤 愛子', 'ito.aiko@example.com', '080-5678-9012', '東京都目黒区目黒5-5-5', '1992-09-30', 'female', 3200, 120000, '2022-08-12 10:45:00', '2024-01-25 17:20:00'),
('渡辺 正男', 'watanabe.masao@example.com', '070-6789-0123', '東京都世田谷区三軒茶屋6-6-6', '1987-01-25', 'male', 650, 25000, '2023-04-08 14:30:00', '2024-01-12 11:15:00'),
('山田 恵子', 'yamada.keiko@example.com', '090-7890-1234', '東京都中野区中野7-7-7', '1984-12-03', 'female', 1800, 65000, '2023-03-18 13:20:00', '2024-01-19 15:40:00'),
('中村 雄一', 'nakamura.yuichi@example.com', '080-8901-2345', '東京都杉並区阿佐ヶ谷8-8-8', '1991-06-14', 'male', 950, 38000, '2023-05-25 16:50:00', '2024-01-16 10:30:00'),
('小林 麻衣', 'kobayashi.mai@example.com', '070-9012-3456', '東京都豊島区池袋9-9-9', '1989-04-07', 'female', 1400, 52000, '2023-07-12 12:00:00', '2024-01-21 14:15:00'),
('加藤 誠', 'kato.makoto@example.com', '090-0123-4567', '東京都北区赤羽10-10-10', '1986-08-19', 'male', 750, 29000, '2023-08-30 11:45:00', '2024-01-14 13:50:00');

-- サンプル購入履歴データの挿入
INSERT INTO purchase_history (customer_id, purchase_date, total_amount, tax_amount, points_earned, points_used, payment_method) VALUES
((SELECT id FROM customers WHERE email = 'tanaka.hanako@example.com'), '2024-01-20 14:20:00', 8500, 850, 85, 0, 'クレジットカード'),
((SELECT id FROM customers WHERE email = 'sato.taro@example.com'), '2024-01-18 16:45:00', 12000, 1200, 120, 0, '現金'),
((SELECT id FROM customers WHERE email = 'suzuki.misaki@example.com'), '2024-01-22 13:30:00', 25000, 2500, 250, 100, 'クレジットカード'),
((SELECT id FROM customers WHERE email = 'takahashi.kenichi@example.com'), '2024-01-15 12:00:00', 6500, 650, 65, 0, '現金'),
((SELECT id FROM customers WHERE email = 'ito.aiko@example.com'), '2024-01-25 17:20:00', 18000, 1800, 180, 50, 'クレジットカード'),
((SELECT id FROM customers WHERE email = 'watanabe.masao@example.com'), '2024-01-12 11:15:00', 9500, 950, 95, 0, '現金'),
((SELECT id FROM customers WHERE email = 'yamada.keiko@example.com'), '2024-01-19 15:40:00', 15000, 1500, 150, 0, 'クレジットカード'),
((SELECT id FROM customers WHERE email = 'nakamura.yuichi@example.com'), '2024-01-16 10:30:00', 11000, 1100, 110, 0, '現金'),
((SELECT id FROM customers WHERE email = 'kobayashi.mai@example.com'), '2024-01-21 14:15:00', 13500, 1350, 135, 0, 'クレジットカード'),
((SELECT id FROM customers WHERE email = 'kato.makoto@example.com'), '2024-01-14 13:50:00', 7800, 780, 78, 0, '現金');

-- 過去の購入履歴も追加（統計計算用）
INSERT INTO purchase_history (customer_id, purchase_date, total_amount, tax_amount, points_earned, points_used, payment_method) VALUES
((SELECT id FROM customers WHERE email = 'tanaka.hanako@example.com'), '2023-12-15 10:30:00', 12000, 1200, 120, 0, 'クレジットカード'),
((SELECT id FROM customers WHERE email = 'sato.taro@example.com'), '2023-12-20 14:15:00', 8500, 850, 85, 0, '現金'),
((SELECT id FROM customers WHERE email = 'suzuki.misaki@example.com'), '2023-12-25 16:45:00', 30000, 3000, 300, 200, 'クレジットカード'),
((SELECT id FROM customers WHERE email = 'takahashi.kenichi@example.com'), '2023-12-10 11:20:00', 5500, 550, 55, 0, '現金'),
((SELECT id FROM customers WHERE email = 'ito.aiko@example.com'), '2023-12-28 13:30:00', 22000, 2200, 220, 100, 'クレジットカード');

-- サンプル購入品目データの挿入
INSERT INTO purchase_items (purchase_id, item_name, unit_price, quantity, total_price) VALUES
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'tanaka.hanako@example.com') AND purchase_date = '2024-01-20 14:20:00'), 'バラの花束', 3500, 1, 3500),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'tanaka.hanako@example.com') AND purchase_date = '2024-01-20 14:20:00'), '花瓶', 5000, 1, 5000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'sato.taro@example.com') AND purchase_date = '2024-01-18 16:45:00'), 'チューリップ', 800, 10, 8000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'sato.taro@example.com') AND purchase_date = '2024-01-18 16:45:00'), '花器', 4000, 1, 4000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'suzuki.misaki@example.com') AND purchase_date = '2024-01-22 13:30:00'), '胡蝶蘭', 20000, 1, 20000),
((SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'suzuki.misaki@example.com') AND purchase_date = '2024-01-22 13:30:00'), 'アレンジメント', 5000, 1, 5000);

-- ポイント取引履歴のサンプルデータ
INSERT INTO point_transactions (customer_id, transaction_type, points, purchase_id, description) VALUES
((SELECT id FROM customers WHERE email = 'tanaka.hanako@example.com'), 'earn', 85, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'tanaka.hanako@example.com') AND purchase_date = '2024-01-20 14:20:00'), '購入によるポイント獲得'),
((SELECT id FROM customers WHERE email = 'sato.taro@example.com'), 'earn', 120, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'sato.taro@example.com') AND purchase_date = '2024-01-18 16:45:00'), '購入によるポイント獲得'),
((SELECT id FROM customers WHERE email = 'suzuki.misaki@example.com'), 'earn', 250, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'suzuki.misaki@example.com') AND purchase_date = '2024-01-22 13:30:00'), '購入によるポイント獲得'),
((SELECT id FROM customers WHERE email = 'suzuki.misaki@example.com'), 'use', 100, (SELECT id FROM purchase_history WHERE customer_id = (SELECT id FROM customers WHERE email = 'suzuki.misaki@example.com') AND purchase_date = '2024-01-22 13:30:00'), '購入時のポイント使用');

-- データ挿入後の確認クエリ
SELECT 
    '顧客数' as metric,
    COUNT(*) as value
FROM customers
UNION ALL
SELECT 
    '購入履歴数' as metric,
    COUNT(*) as value
FROM purchase_history
UNION ALL
SELECT 
    '購入品目数' as metric,
    COUNT(*) as value
FROM purchase_items
UNION ALL
SELECT 
    'ポイント取引数' as metric,
    COUNT(*) as value
FROM point_transactions;
