-- ログイン中ユーザーの customers 行に customer_code が無ければ付与する
-- 前提: add_customer_code.sql で customer_code 列と generate_customer_code() が存在すること
--
-- Supabase SQL Editor で実行

CREATE OR REPLACE FUNCTION public.ensure_my_customer_code()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
  rid uuid;
  existing text;
  new_code varchar(5);
  e_jwt text := nullif(trim(auth.jwt() ->> 'email'), '');
  e_auth text;
  e_norm text;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT nullif(trim(u.email), '') INTO e_auth FROM auth.users u WHERE u.id = uid;
  e_norm := lower(trim(coalesce(e_jwt, e_auth, '')));

  SELECT c.id, c.customer_code
  INTO rid, existing
  FROM public.customers c
  WHERE c.user_id = uid
  LIMIT 1;

  IF rid IS NULL THEN
    SELECT c.id, c.customer_code
    INTO rid, existing
    FROM public.customers c
    WHERE c.id = uid
    LIMIT 1;
  END IF;

  IF rid IS NULL AND e_norm <> '' THEN
    SELECT c.id, c.customer_code
    INTO rid, existing
    FROM public.customers c
    WHERE lower(trim(c.email)) = e_norm
    ORDER BY c.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF rid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_customer_row');
  END IF;

  IF existing IS NOT NULL AND length(trim(existing)) > 0 THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'customer_code', existing);
  END IF;

  new_code := public.generate_customer_code();
  UPDATE public.customers c
  SET customer_code = new_code, updated_at = now()
  WHERE c.id = rid
    AND (c.customer_code IS NULL OR trim(c.customer_code) = '');

  RETURN jsonb_build_object('ok', true, 'customer_code', new_code);
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_customer_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_customer_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_my_customer_code() TO service_role;

COMMENT ON FUNCTION public.ensure_my_customer_code() IS
  '顧客行の customer_code が空なら generate_customer_code() で埋める';
