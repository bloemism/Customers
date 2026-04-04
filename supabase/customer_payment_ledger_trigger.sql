-- =============================================================================
-- 決済レジャー一元化: customer_payments 完了行を正とし、ポイント履歴・顧客残高を DB で自動適用
-- =============================================================================
-- 流れ:
--   1) アプリ / webhook は「completed の customer_payments を 1 行 INSERT（または pending→completed UPDATE）」に集中
--   2) 本トリガーが point_history と customers を一度だけ更新（ledger_applied_at で冪等）
--   3) 月次 KPI・ランキングは既存の ranking_completed_payment_events（customer_payments 含む）から参照
--
-- 適用後: アプリ側の recordPointHistoryForPayment / applyCustomerPointsAfterPayment は呼ばないこと。
-- api/stripe-webhook.js も customer_payments INSERT のみにし、顧客更新・point_history 直書きは削除すること。
-- =============================================================================

-- 冪等フラグ（NULL = 未適用）
ALTER TABLE public.customer_payments
  ADD COLUMN IF NOT EXISTS ledger_applied_at TIMESTAMPTZ;

COMMENT ON COLUMN public.customer_payments.ledger_applied_at IS
  'apply_customer_payment_ledger により point_history / customers 更新済みの時刻（再実行防止）';

-- 顧客テーブルに webhook 由来の列が無い環境向け（既にある場合はスキップ）
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_points INTEGER;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_purchase_amount NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.apply_customer_payment_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_uuid uuid;
  v_user_id uuid;
  v_earn integer;
  v_use integer;
  v_amt numeric;
  v_label text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  IF NEW.ledger_applied_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_earn := COALESCE(NEW.points_earned, 0);
  v_use := COALESCE(NEW.points_used, NEW.points_spent, 0);
  v_amt := COALESCE(NEW.amount, 0::numeric);

  v_label := COALESCE(
    NULLIF(TRIM(NEW.payment_data->>'store_name'), ''),
    NULLIF(TRIM(NEW.payment_data->>'storeName'), ''),
    COALESCE(NEW.payment_method, '決済')
  );

  -- customer_id → uuid
  BEGIN
    IF NEW.customer_id IS NOT NULL AND TRIM(NEW.customer_id::text) <> '' THEN
      v_customer_uuid := TRIM(NEW.customer_id::text)::uuid;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_customer_uuid := NULL;
  END;

  IF v_customer_uuid IS NULL AND NEW.user_id IS NOT NULL AND TRIM(NEW.user_id::text) <> '' THEN
    BEGIN
      v_user_id := TRIM(NEW.user_id::text)::uuid;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_user_id := NULL;
    END;
    IF v_user_id IS NOT NULL THEN
      SELECT c.id INTO v_customer_uuid
      FROM public.customers c
      WHERE c.user_id = v_user_id
      LIMIT 1;
    END IF;
  END IF;

  IF v_customer_uuid IS NULL THEN
    RAISE WARNING 'apply_customer_payment_ledger: no customer resolved for customer_payments.id=%', NEW.id;
    UPDATE public.customer_payments
    SET ledger_applied_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  SELECT c.user_id INTO v_user_id
  FROM public.customers c
  WHERE c.id = v_customer_uuid
  LIMIT 1;

  -- point_history（理由に cp_ledger id を含めて追跡可能）
  IF v_earn > 0 THEN
    INSERT INTO public.point_history (
      user_id,
      customer_id,
      points,
      reason,
      type,
      created_at
    ) VALUES (
      v_user_id,
      v_customer_uuid,
      v_earn,
      format('決済完了（付与）[cp_ledger:%s] %s', NEW.id, v_label),
      'earned',
      COALESCE(NEW.created_at, now())
    );
  END IF;

  IF v_use > 0 THEN
    INSERT INTO public.point_history (
      user_id,
      customer_id,
      points,
      reason,
      type,
      created_at
    ) VALUES (
      v_user_id,
      v_customer_uuid,
      -v_use,
      format('決済時のポイント利用 [cp_ledger:%s] %s', NEW.id, v_label),
      'used',
      COALESCE(NEW.created_at, now())
    );
  END IF;

  -- 顧客残高・購入累計（points / total_points は同じ増分）
  UPDATE public.customers c
  SET
    points = COALESCE(c.points, c.total_points, 0) + v_earn - v_use,
    total_points = COALESCE(c.total_points, c.points, 0) + v_earn - v_use,
    total_purchase_amount = COALESCE(c.total_purchase_amount, 0) + round(v_amt)::numeric,
    last_purchase_date = COALESCE(NEW.created_at, now()),
    updated_at = now()
  WHERE c.id = v_customer_uuid;

  UPDATE public.customer_payments
  SET ledger_applied_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.apply_customer_payment_ledger() IS
  'customer_payments が completed になったとき point_history / customers を 1 回だけ更新する';

DROP TRIGGER IF EXISTS trg_customer_payment_ledger_ins ON public.customer_payments;
CREATE TRIGGER trg_customer_payment_ledger_ins
  AFTER INSERT ON public.customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_customer_payment_ledger();

DROP TRIGGER IF EXISTS trg_customer_payment_ledger_upd ON public.customer_payments;
CREATE TRIGGER trg_customer_payment_ledger_upd
  AFTER UPDATE OF status ON public.customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_customer_payment_ledger();
