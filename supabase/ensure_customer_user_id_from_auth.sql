-- customers.user_id を auth と突き合わせて補正する RPC（SECURITY DEFINER）
-- RLS が auth.uid() = user_id のとき、user_id がずれていると SELECT 0 件 → ゲスト表示になる。
--
-- 再適用: Supabase SQL Editor で本ファイルを丸ごと実行（CREATE OR REPLACE で上書き）

CREATE OR REPLACE FUNCTION public.ensure_customer_user_id_from_auth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
  e_jwt text := nullif(trim(auth.jwt() ->> 'email'), '');
  e_auth text;
  e_norm text;
  n_by_id int := 0;
  n_by_email int := 0;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- JWT の email が最優先（ログイン直後でも取れる）。無ければ auth.users
  SELECT nullif(trim(u.email), '') INTO e_auth FROM auth.users u WHERE u.id = uid;
  e_norm := lower(trim(coalesce(e_jwt, e_auth, '')));

  IF e_norm = '' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'no_email',
      'detail', 'jwt email and auth.users email both empty'
    );
  END IF;

  -- レガシー: customers.id が auth.uid と同一主キーの行
  UPDATE customers c
  SET
    user_id = uid,
    updated_at = now()
  WHERE c.id = uid
    AND (c.user_id IS DISTINCT FROM uid);
  GET DIAGNOSTICS n_by_id = ROW_COUNT;

  -- メール一致（auth のメールと customers.email）
  UPDATE customers c
  SET
    user_id = uid,
    updated_at = now()
  WHERE lower(trim(c.email)) = e_norm
    AND (c.user_id IS DISTINCT FROM uid);
  GET DIAGNOSTICS n_by_email = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'rows_by_id', n_by_id,
    'rows_by_email', n_by_email,
    'rows_total', n_by_id + n_by_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_customer_user_id_from_auth() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_customer_user_id_from_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_customer_user_id_from_auth() TO service_role;

COMMENT ON FUNCTION public.ensure_customer_user_id_from_auth() IS
  'JWT / auth.users のメールと customers を突き合わせ user_id を auth.uid() に揃える。id=auth.uid の行も補正。';

-- データだけ一括で直したい場合（RPC とは別に、必要なら SQL Editor で単体実行）
-- UPDATE customers c
-- SET user_id = au.id, updated_at = now()
-- FROM auth.users au
-- WHERE lower(trim(c.email)) = lower(trim(au.email))
--   AND (c.user_id IS DISTINCT FROM au.id);
