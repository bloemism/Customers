-- payment_codesテーブルのRLSポリシー修正

-- 1. 現在のポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'payment_codes' 
AND schemaname = 'public';

-- 2. 既存のポリシーを削除
DROP POLICY IF EXISTS "Enable read access for valid codes" ON payment_codes;
DROP POLICY IF EXISTS "Enable insert access for all users" ON payment_codes;
DROP POLICY IF EXISTS "Enable update access for all users" ON payment_codes;

-- 3. 新しいポリシーを作成（より緩い設定）
-- 全ユーザーが参照可能
CREATE POLICY "Allow read access to all users" ON payment_codes
FOR SELECT USING (true);

-- 全ユーザーが挿入可能
CREATE POLICY "Allow insert access to all users" ON payment_codes
FOR INSERT WITH CHECK (true);

-- 全ユーザーが更新可能
CREATE POLICY "Allow update access to all users" ON payment_codes
FOR UPDATE USING (true);

-- 全ユーザーが削除可能（必要に応じて）
CREATE POLICY "Allow delete access to all users" ON payment_codes
FOR DELETE USING (true);

-- 4. RLSが有効になっているか確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'payment_codes' 
AND schemaname = 'public';

-- 5. テスト用データの確認
SELECT 
    code,
    store_id,
    payment_data->>'storeName' as store_name,
    payment_data->'totalAmount' as total_amount,
    expires_at,
    used_at
FROM payment_codes 
WHERE code IN ('12345', '54321', '16492');

-- 6. 成功メッセージ
DO $$
BEGIN
    RAISE NOTICE 'payment_codesテーブルのRLSポリシーを修正しました！';
    RAISE NOTICE '全ユーザーが読み取り・書き込み可能になりました';
END $$;
