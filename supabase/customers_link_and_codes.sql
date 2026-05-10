-- =============================================================================
-- 顧客アプリ: customers と普通に連携できるようにする + 顧客コード NULL を埋める
-- =============================================================================
-- 想定: RLS が「auth.uid() = user_id のみ」のとき、レガシー行（id = auth.uid() で
--       user_id が NULL）が SELECT/UPDATE できず「連携できない」状態になる。
-- 対策: 認証ユーザー向けに「user_id または id が auth.uid()」のポリシーを 1 本追加する
--       （既存ポリシーと併存しても、PostgreSQL の PERMISSIVE は OR になるため足りる）。
--
-- Supabase SQL Editor でこのファイルを丸ごと実行してください。
-- =============================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_own_by_user_or_legacy_id" ON public.customers;

CREATE POLICY "customers_own_by_user_or_legacy_id"
ON public.customers
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

COMMENT ON POLICY "customers_own_by_user_or_legacy_id" ON public.customers IS
  '顧客本人: user_id または主キー id が auth.uid() の行に通常の Supabase クライアントでアクセス可能にする';

-- -----------------------------------------------------------------------------
-- 顧客コードが NULL（または空）の行だけ一括付与（管理者用・バッチ）
-- 前提: public.generate_customer_code() が存在すること（add_customer_code.sql 等）
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  newcode varchar(5);
  attempts int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'generate_customer_code'
  ) THEN
    RAISE EXCEPTION 'public.generate_customer_code() がありません。先に add_customer_code.sql を実行してください。';
  END IF;

  FOR r IN
    SELECT id FROM public.customers
    WHERE customer_code IS NULL OR trim(customer_code) = ''
  LOOP
    attempts := 0;
    LOOP
      newcode := public.generate_customer_code();
      attempts := attempts + 1;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.customers WHERE customer_code = newcode
      );
      IF attempts > 50 THEN
        RAISE EXCEPTION '顧客コード生成の衝突が多すぎます id=%', r.id;
      END IF;
    END LOOP;

    UPDATE public.customers
    SET customer_code = newcode, updated_at = now()
    WHERE id = r.id;
  END LOOP;
END $$;
