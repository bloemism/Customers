-- Step 1: 関数の削除と再作成
-- Supabaseセキュリティ警告修正 - 第1段階

-- 1. 既存のupdate_updated_at_column関数をCASCADEで削除
-- 依存するトリガーも一緒に削除されます
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 2. セキュアなupdate_updated_at_column関数を再作成
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

-- 3. 関数の権限設定
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon;
