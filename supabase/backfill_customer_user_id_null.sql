-- user_id が NULL の customers 行に、メール一致する auth.users.id を入れる（一括修復）
-- Supabase → SQL Editor で実行。実行前に下の SELECT で対象を確認すること。
--
-- 注意:
-- - customers.email と auth.users.email が一致している行だけが更新される
-- - 同一メールで customers が複数あると、同じ user_id が複数行に入る（重複行の整理は別途）

-- 1) 対象プレビュー（user_id IS NULL）
SELECT
  c.id AS customer_row_id,
  c.email AS customer_email,
  c.name,
  c.user_id,
  au.id AS auth_user_id,
  au.email AS auth_email
FROM public.customers c
LEFT JOIN auth.users au
  ON lower(trim(c.email)) = lower(trim(au.email))
WHERE c.user_id IS NULL
ORDER BY c.created_at NULLS LAST, c.email;

-- 2) 実更新（上の結果を見て問題なければ実行）
UPDATE public.customers c
SET
  user_id = au.id,
  updated_at = now()
FROM auth.users au
WHERE c.user_id IS NULL
  AND c.email IS NOT NULL
  AND length(trim(c.email)) > 0
  AND lower(trim(c.email)) = lower(trim(au.email));

-- 3) まだ NULL が残るか確認（auth に同じメールのユーザーがいない場合など）
SELECT id, email, name, user_id, created_at
FROM public.customers
WHERE user_id IS NULL;
