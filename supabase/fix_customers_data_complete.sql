-- customersデータの完全修正

-- 1. 現在の状況を確認
SELECT '=== 現在のcustomersテーブルの状況 ===' as status;
SELECT 
  id,
  user_id,
  email,
  name,
  created_at
FROM customers 
ORDER BY created_at DESC;

-- 2. 認証ユーザーの確認
SELECT '=== 認証ユーザーの状況 ===' as status;
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'botanism2011@gmail.com'
ORDER BY created_at DESC;

-- 3. 問題のあるデータを削除（user_idがnullまたは存在しない認証IDを参照）
DELETE FROM customers 
WHERE user_id IS NULL 
   OR user_id NOT IN (SELECT id FROM auth.users);

-- 4. 重複データを削除（最新のもの以外）
WITH ranked_customers AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM customers
  WHERE email = 'botanism2011@gmail.com'
)
DELETE FROM customers 
WHERE id IN (
  SELECT id FROM ranked_customers WHERE rn > 1
);

-- 5. 正しい認証IDでcustomersデータを作成/更新
-- まず、認証ユーザーIDを取得
DO $$
DECLARE
    auth_user_id UUID;
    customer_exists BOOLEAN;
BEGIN
    -- 認証ユーザーIDを取得
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'botanism2011@gmail.com' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF auth_user_id IS NOT NULL THEN
        -- customersデータが存在するかチェック
        SELECT EXISTS(
            SELECT 1 FROM customers 
            WHERE user_id = auth_user_id
        ) INTO customer_exists;
        
        IF NOT customer_exists THEN
            -- customersデータを作成
            INSERT INTO customers (
                user_id, 
                email, 
                name, 
                phone, 
                points, 
                level
            ) VALUES (
                auth_user_id,
                'botanism2011@gmail.com',
                '中三川聖次',
                '09014042509',
                0,
                'BASIC'
            );
        ELSE
            -- 既存のcustomersデータを更新
            UPDATE customers 
            SET 
                email = 'botanism2011@gmail.com',
                name = '中三川聖次',
                phone = '09014042509',
                points = 0,
                level = 'BASIC',
                updated_at = NOW()
            WHERE user_id = auth_user_id;
        END IF;
    END IF;
END $$;

-- 6. 最終確認
SELECT '=== 修正後の状況 ===' as status;
SELECT 
  c.id,
  c.user_id,
  c.email,
  c.name,
  c.phone,
  c.points,
  c.level,
  c.created_at,
  au.id as auth_user_id,
  au.email as auth_email
FROM customers c
LEFT JOIN auth.users au ON c.user_id = au.id
WHERE c.email = 'botanism2011@gmail.com';

-- 7. 認証IDでcustomersデータが取得できるかテスト
SELECT '=== 認証IDでの取得テスト ===' as status;
SELECT * FROM customers 
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'botanism2011@gmail.com' 
    ORDER BY created_at DESC 
    LIMIT 1
);

