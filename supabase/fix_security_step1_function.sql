-- Step 1: 関数の削除と再作成
-- Supabaseセキュリティ警告修正 - 第1段階

-- 既存の関数を削除
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- セキュアな関数を再作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon;
