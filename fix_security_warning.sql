-- Function Search Path Mutable 警告を解決
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_customer() CASCADE;

-- 修正された関数を作成（SECURITY DEFINER と SET search_path を追加）
CREATE OR REPLACE FUNCTION handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
  -- user_metadataにuser_typeが'customer'の場合のみcustomersテーブルに挿入
  IF NEW.raw_user_meta_data->>'user_type' = 'customer' THEN
    INSERT INTO public.customers (id, email, name, phone, points, level)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', '未設定'),
      NEW.raw_user_meta_data->>'phone',
      0,
      'BASIC'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 修正されたトリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_customer();
