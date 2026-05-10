-- 新規 auth ユーザー作成時に public.customers を自動作成し、user_id を必ず割り当てる
-- プロフィール画面は UPDATE だけでよくなる（user_id が null で RLS に阻まれる問題の予防）
--
-- Supabase SQL Editor で実行。
-- 注意: 既に auth.users に対する別トリガー（例: store_owner 用）がある場合も、このトリガーは同じ INSERT で走る。
--       store_owner 用が「全ユーザーにプロフィール INSERT」しているなら、そちらを user_type で分岐させること。

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_customer_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.email IS NULL OR length(trim(NEW.email)) = 0 THEN
    RETURN NEW;
  END IF;

  -- 店舗オーナー登録は customers 行を作らない
  IF NEW.raw_user_meta_data->>'user_type' = 'store_owner' THEN
    RETURN NEW;
  END IF;

  -- 既に行がある（アプリや RPC が先に作った）場合は何もしない
  IF EXISTS (SELECT 1 FROM public.customers c WHERE c.user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- id は gen_random_uuid() 想定（fix_customers_table_and_policies 系）。user_id だけ必ず紐づける。
  BEGIN
    INSERT INTO public.customers (
      user_id,
      email,
      name,
      points,
      level,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), '未設定'),
      0,
      'BASIC',
      now(),
      now()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- メール UNIQUE 等で競合した場合は手動／ensure_customer_user_id_from_auth に委ねる
      NULL;
  END;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_auth_user_customer_row() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_auth_user_create_customer_row ON auth.users;

CREATE TRIGGER on_auth_user_create_customer_row
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user_customer_row();

COMMENT ON FUNCTION public.handle_new_auth_user_customer_row() IS
  '顧客サインアップ時に customers 行を自動作成し user_id = auth.users.id を設定する';

-- ---------------------------------------------------------------------------
-- スキーマ B: customers.id が auth.users.id と同一 PK の場合は、上の INSERT を次に差し替える
-- （customers_schema.sql の id REFERENCES auth.users(id) など）
--
-- INSERT INTO public.customers (id, user_id, email, name, points, level, created_at, updated_at)
-- VALUES (
--   NEW.id,
--   NEW.id,
--   NEW.email,
--   COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), '未設定'),
--   0,
--   'BASIC',
--   now(),
--   now()
-- )
-- ON CONFLICT (id) DO NOTHING;
