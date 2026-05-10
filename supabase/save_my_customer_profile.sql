-- マイプロフィール保存（INSERT / UPDATE を SECURITY DEFINER で一括処理）
-- クライアントの RLS で UPDATE/INSERT が通らない環境でも、必ず auth.uid() に紐づく 1 行を保存する。
--
-- Supabase SQL Editor で実行後、アプリは save_my_customer_profile を最優先で呼びます。

CREATE OR REPLACE FUNCTION public.save_my_customer_profile(p_profile jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
  rid uuid;
  n int;
  v_birth date;
  v_birth_raw text;
  e_jwt text := nullif(trim(auth.jwt() ->> 'email'), '');
  e_auth text;
  e_norm text;
  uemail text;
  v_name text;
  v_phone text;
  v_address text;
  v_alphabet text;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT nullif(trim(u.email), '') INTO e_auth FROM auth.users u WHERE u.id = uid;
  e_norm := lower(trim(coalesce(e_jwt, e_auth, '')));

  IF e_norm = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_email', 'hint', 'auth.users / JWT に email がありません');
  END IF;

  uemail := e_auth;
  IF uemail IS NULL OR trim(uemail) = '' THEN
    uemail := e_jwt;
  END IF;

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

  v_name := coalesce(nullif(trim(p_profile ->> 'name'), ''), '未設定');
  v_phone := CASE WHEN p_profile ? 'phone' THEN nullif(trim(p_profile ->> 'phone'), '') ELSE NULL END;
  v_address := CASE WHEN p_profile ? 'address' THEN nullif(trim(p_profile ->> 'address'), '') ELSE NULL END;
  v_alphabet := CASE WHEN p_profile ? 'alphabet' THEN nullif(trim(p_profile ->> 'alphabet'), '') ELSE NULL END;

  SELECT c.id
  INTO rid
  FROM public.customers c
  WHERE c.user_id = uid
     OR c.id = uid
     OR (e_norm <> '' AND lower(trim(c.email)) = e_norm)
  ORDER BY
    CASE WHEN c.user_id = uid THEN 0 WHEN c.id = uid THEN 1 ELSE 2 END,
    c.updated_at DESC NULLS LAST
  LIMIT 1;

  IF rid IS NOT NULL THEN
    UPDATE public.customers c
    SET
      user_id = uid,
      name = CASE WHEN p_profile ? 'name' THEN coalesce(nullif(trim(p_profile ->> 'name'), ''), '未設定') ELSE c.name END,
      phone = CASE WHEN p_profile ? 'phone' THEN nullif(trim(p_profile ->> 'phone'), '') ELSE c.phone END,
      address = CASE WHEN p_profile ? 'address' THEN nullif(trim(p_profile ->> 'address'), '') ELSE c.address END,
      alphabet = CASE WHEN p_profile ? 'alphabet' THEN nullif(trim(p_profile ->> 'alphabet'), '') ELSE c.alphabet END,
      birth_date = CASE WHEN p_profile ? 'birth_date' THEN v_birth ELSE c.birth_date END,
      updated_at = now()
    WHERE c.id = rid;

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n = 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'update_zero_rows', 'hint', rid::text);
    END IF;
    RETURN jsonb_build_object('ok', true, 'mode', 'update', 'id', rid);
  END IF;

  INSERT INTO public.customers (
    id,
    user_id,
    email,
    name,
    phone,
    address,
    alphabet,
    birth_date,
    points,
    level,
    updated_at
  )
  VALUES (
    uid,
    uid,
    uemail,
    v_name,
    v_phone,
    v_address,
    v_alphabet,
    v_birth,
    0,
    'BASIC',
    now()
  );

  RETURN jsonb_build_object('ok', true, 'mode', 'insert', 'id', uid);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'unique_violation',
      'hint',
      'email または id の一意制約に抵触しました。既存行の user_id を ensure_customer_user_id_from_auth で揃えてください。'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', 'exception', 'message', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.save_my_customer_profile(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_my_customer_profile(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_my_customer_profile(jsonb) TO service_role;

COMMENT ON FUNCTION public.save_my_customer_profile(jsonb) IS
  'ログイン中ユーザーの customers 行を保存（存在すれば UPDATE、なければ INSERT）。RLS をバイパス。';
