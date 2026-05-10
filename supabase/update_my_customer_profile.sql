-- マイプロフィール更新（RLS でクライアント UPDATE が 0 件になる場合の回避）
-- JWT の auth.uid() に紐づく customers 行を更新する。SECURITY DEFINER で RLS をバイパス。
--
-- Supabase SQL Editor で実行

CREATE OR REPLACE FUNCTION public.update_my_customer_profile(p_profile jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
  n int;
  v_birth date;
  v_birth_raw text;
  e_jwt text := nullif(trim(auth.jwt() ->> 'email'), '');
  e_auth text;
  e_norm text;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT nullif(trim(u.email), '') INTO e_auth FROM auth.users u WHERE u.id = uid;
  e_norm := lower(trim(coalesce(e_jwt, e_auth, '')));

  v_birth_raw := nullif(trim(p_profile ->> 'birth_date'), '');
  IF v_birth_raw IS NULL THEN
    v_birth := NULL;
  ELSE
    BEGIN
      v_birth := v_birth_raw::date;
    EXCEPTION WHEN OTHERS THEN
      v_birth := NULL;
    END;
  END IF;

  UPDATE public.customers c
  SET
    -- RLS が user_id のみの環境では、id=auth.uid() だけのレガシー行でも SELECT できるよう必ず紐づける
    user_id = uid,
    name = CASE
      WHEN p_profile ? 'name' THEN COALESCE(nullif(trim(p_profile ->> 'name'), ''), '未設定')
      ELSE c.name
    END,
    phone = CASE
      WHEN p_profile ? 'phone' THEN nullif(trim(p_profile ->> 'phone'), '')
      ELSE c.phone
    END,
    address = CASE
      WHEN p_profile ? 'address' THEN nullif(trim(p_profile ->> 'address'), '')
      ELSE c.address
    END,
    alphabet = CASE
      WHEN p_profile ? 'alphabet' THEN nullif(trim(p_profile ->> 'alphabet'), '')
      ELSE c.alphabet
    END,
    birth_date = CASE
      WHEN p_profile ? 'birth_date' THEN v_birth
      ELSE c.birth_date
    END,
    updated_at = now()
  WHERE c.user_id = uid
     OR c.id = uid
     OR (e_norm <> '' AND lower(trim(c.email)) = e_norm);

  GET DIAGNOSTICS n = ROW_COUNT;

  IF n = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'no_row_updated',
      'hint', 'customers に user_id / id / email が auth と一致する行があるか確認してください'
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'rows', n);
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_customer_profile(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_customer_profile(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_customer_profile(jsonb) TO service_role;

COMMENT ON FUNCTION public.update_my_customer_profile(jsonb) IS
  'ログイン中ユーザーの customers 行を p_profile のキーに応じて更新（RLS 回避）';
