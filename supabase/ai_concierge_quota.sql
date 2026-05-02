-- ===========================================================================
--  AI Flower Concierge — 1日10回までの利用クォータ（Supabase Auth ベース）
--  -----------------------------------------------------------------------
--  目的:
--    Gemini API の悪用・コスト暴走を防ぐため、ログイン顧客 1 人あたり
--    日次の利用回数を Supabase で原子的に集計し、上限を超えた場合は
--    API サーバーから HTTP 429 を返す。
--
--  仕組み:
--    - 認証は Supabase Auth の JWT を信頼（PostgREST が auth.uid() を提供）
--    - SECURITY DEFINER の RPC が auth.uid() でしか動かないので、
--      他人の枠を消費したり盗み見ることは不可能
--    - クライアントはテーブルへ直接 INSERT/UPDATE できない（RLS で禁止）
--      → 必ず RPC 経由でしか書けない
-- ===========================================================================

-- 1. 利用回数テーブル（user_id × 日付 で 1 行）
CREATE TABLE IF NOT EXISTS public.ai_concierge_usage (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date  DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Tokyo'),
  count       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date),
  CONSTRAINT ai_concierge_usage_count_nonneg CHECK (count >= 0)
);

CREATE INDEX IF NOT EXISTS ai_concierge_usage_date_idx
  ON public.ai_concierge_usage (usage_date);

COMMENT ON TABLE public.ai_concierge_usage IS
  'AI Flower Concierge の利用回数（user_id × 日次）。書き込みは RPC 経由のみ。';

-- 2. RLS: 自分の行だけ参照可。直接 INSERT/UPDATE/DELETE は不可（RPC のみ）
ALTER TABLE public.ai_concierge_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_concierge_usage_select_own ON public.ai_concierge_usage;
CREATE POLICY ai_concierge_usage_select_own ON public.ai_concierge_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. JST（日本標準時）での「今日の日付」を返すヘルパー
CREATE OR REPLACE FUNCTION public.ai_concierge_today_jst()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT (NOW() AT TIME ZONE 'Asia/Tokyo')::DATE;
$$;

-- 4. 原子的な「上限チェック → インクリメント」関数
--    呼び出し成功時は使用済み件数を 1 増やし、超過時は false を返す
--    SECURITY DEFINER だが auth.uid() を強制的に参照するので他人の枠は触れない
CREATE OR REPLACE FUNCTION public.try_consume_ai_concierge_quota(
  p_daily_limit INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := public.ai_concierge_today_jst();
  v_used INTEGER;
  v_allowed BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'allowed', false,
      'used', 0,
      'limit', p_daily_limit,
      'remaining', 0,
      'error', 'unauthenticated',
      'reason', '認証が必要です'
    );
  END IF;

  IF p_daily_limit < 1 THEN
    p_daily_limit := 1;
  END IF;

  -- 既存行がなければ作って count=0 から開始（RPC 内なので RLS バイパス可能）
  INSERT INTO public.ai_concierge_usage AS u (user_id, usage_date, count)
  VALUES (v_user_id, v_today, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  -- 同一トランザクション内で行ロック → 件数取得 → 超過判定 → 増加
  -- FOR UPDATE で並列 N リクエストでも競合せずに正確にカウント
  SELECT u.count INTO v_used
  FROM public.ai_concierge_usage u
  WHERE u.user_id = v_user_id
    AND u.usage_date = v_today
  FOR UPDATE;

  IF v_used >= p_daily_limit THEN
    RETURN json_build_object(
      'allowed', false,
      'used', v_used,
      'limit', p_daily_limit,
      'remaining', 0,
      'reset_at', (v_today + INTERVAL '1 day')::TEXT,
      'reason', '本日の利用上限に達しました'
    );
  END IF;

  UPDATE public.ai_concierge_usage u
  SET count = u.count + 1,
      updated_at = NOW()
  WHERE u.user_id = v_user_id
    AND u.usage_date = v_today
  RETURNING u.count INTO v_used;

  v_allowed := v_used <= p_daily_limit;

  RETURN json_build_object(
    'allowed', v_allowed,
    'used', v_used,
    'limit', p_daily_limit,
    'remaining', GREATEST(p_daily_limit - v_used, 0),
    'reset_at', (v_today + INTERVAL '1 day')::TEXT
  );
END;
$$;

REVOKE ALL ON FUNCTION public.try_consume_ai_concierge_quota(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_consume_ai_concierge_quota(INTEGER) TO authenticated;

COMMENT ON FUNCTION public.try_consume_ai_concierge_quota(INTEGER) IS
  'AI Concierge: auth.uid() のクォータを 1 消費し JSON を返す。超過時は allowed=false で増えない。';

-- 5. 読み取り専用のクォータ確認関数（フロントが残り回数を取得するため）
CREATE OR REPLACE FUNCTION public.get_ai_concierge_quota_status(
  p_daily_limit INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := public.ai_concierge_today_jst();
  v_used INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'allowed', false,
      'used', 0,
      'limit', p_daily_limit,
      'remaining', 0,
      'error', 'unauthenticated'
    );
  END IF;

  SELECT u.count INTO v_used
  FROM public.ai_concierge_usage u
  WHERE u.user_id = v_user_id
    AND u.usage_date = v_today;

  v_used := COALESCE(v_used, 0);

  RETURN json_build_object(
    'allowed', v_used < p_daily_limit,
    'used', v_used,
    'limit', p_daily_limit,
    'remaining', GREATEST(p_daily_limit - v_used, 0),
    'reset_at', (v_today + INTERVAL '1 day')::TEXT
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_ai_concierge_quota_status(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ai_concierge_quota_status(INTEGER) TO authenticated;

COMMENT ON FUNCTION public.get_ai_concierge_quota_status(INTEGER) IS
  'AI Concierge: 現在の残りクォータを返す（消費しない・読み取り専用）。';
