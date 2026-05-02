import { supabase } from '../lib/supabase'
import { apiUrl } from '../lib/apiBase'

/** Gemini へ送る画像（base64、プレフィックスなし） */
export type ConciergeImagePayload = { mimeType: string; data: string }

export type ConciergeMessage =
  | { role: 'user'; text: string; images?: ConciergeImagePayload[] }
  | { role: 'assistant'; text: string }

/** 1日のクォータ情報（サーバー側 RPC の戻り値と一致） */
export type ConciergeQuota = {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  reset_at?: string
  reason?: string
  error?: string
}

/** sendConciergeMessages の正常戻り値 */
export type ConciergeSendResult = {
  text: string
  quota: ConciergeQuota | null
}

/** クォータ超過時にスローする専用エラー */
export class ConciergeQuotaExceededError extends Error {
  readonly quota: ConciergeQuota | null
  constructor(message: string, quota: ConciergeQuota | null) {
    super(message)
    this.name = 'ConciergeQuotaExceededError'
    this.quota = quota
  }
}

/** ログイン必須の API。未認証時にスロー */
export class ConciergeUnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConciergeUnauthorizedError'
  }
}

const DEV_CONCIERGE_PATH = '/__gemini_dev/concierge'

function parseJsonResponse(
  raw: string,
  response: Response
): { success?: boolean; text?: string; error?: string; quota?: ConciergeQuota; rateLimited?: boolean; unauthorized?: boolean } {
  try {
    return JSON.parse(raw)
  } catch {
    const snippet = raw.replace(/\s+/g, ' ').trim().slice(0, 160)
    const looksHtml = /<!doctype|<html/i.test(raw)
    const localHint =
      import.meta.env.DEV
        ? ' .env に GEMINI_API_KEY を設定して Vite を再起動するか、npm run dev:full で API を起動してください。'
        : ''
    const protectionHint =
      response.status === 401 || response.status === 403
        ? ' Vercel の Deployment Protection の可能性があります。'
        : ''
    throw new Error(
      `API の応答が JSON ではありません（HTTP ${response.status}）。${looksHtml ? 'HTML が返っています（プロキシ先が落ちている等）。' : ''}${protectionHint}${localHint}${snippet ? ` 先頭: ${snippet}` : ''}`
    )
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function sendViaViteDevMiddleware(
  messages: ConciergeMessage[]
): Promise<ConciergeSendResult> {
  const authHeader = await getAuthHeader()
  let response: Response
  try {
    response = await fetch(DEV_CONCIERGE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ messages }),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`開発用 Gemini ルートに接続できません（${msg}）。`)
  }

  const raw = await response.text()
  const data = parseJsonResponse(raw, response)

  if (response.status === 503 && /GEMINI_API_KEY/i.test(data.error || '')) {
    throw new DevGeminiKeyMissing(data.error)
  }

  if (response.status === 401 || data.unauthorized) {
    throw new ConciergeUnauthorizedError(
      data.error || 'ログインが必要です。お手数ですが再度ログインしてください。'
    )
  }

  if (response.status === 429 || data.rateLimited) {
    throw new ConciergeQuotaExceededError(
      data.error || '本日の利用上限に達しました。',
      data.quota ?? null
    )
  }

  if (!response.ok || !data.success) {
    const base = data.error || `リクエストに失敗しました (${response.status})`
    throw new Error(base)
  }

  if (!data.text?.trim()) {
    throw new Error('回答が空でした')
  }

  return { text: data.text, quota: data.quota ?? null }
}

/** Vite プロセスに GEMINI_API_KEY が無いとき、サーバー API へフォールバックするためのシグナル */
class DevGeminiKeyMissing extends Error {
  constructor(message?: string) {
    super(message || 'GEMINI_API_KEY が Vite に見えていません')
    this.name = 'DevGeminiKeyMissing'
  }
}

/** Gemini コンシェルジュ API の URL（本番・dev:full のサーバー経由用） */
export function getConciergeRequestUrl(): string {
  // dev: 相対パス → Vite proxy が /api/* を localhost:3000 へ転送
  // 本番: apiBase で window.location.origin か VITE_API_BASE_URL を解決
  return apiUrl('/api/gemini-concierge')
}

async function sendViaServer(messages: ConciergeMessage[]): Promise<ConciergeSendResult> {
  const url = getConciergeRequestUrl()
  const authHeader = await getAuthHeader()

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ messages }),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(
      `API に接続できません（${msg}）。ローカルでは npm run dev:full、または .env の GEMINI_API_KEY で npm run dev のみでも可。`
    )
  }

  const raw = await response.text()
  const data = parseJsonResponse(raw, response)

  if (response.status === 401 || data.unauthorized) {
    throw new ConciergeUnauthorizedError(
      data.error || 'ログインが必要です。お手数ですが再度ログインしてください。'
    )
  }

  if (response.status === 429 || data.rateLimited) {
    throw new ConciergeQuotaExceededError(
      data.error || '本日の利用上限に達しました。',
      data.quota ?? null
    )
  }

  if (!response.ok || !data.success) {
    const base = data.error || `リクエストに失敗しました (${response.status})`
    throw new Error(base)
  }

  if (!data.text) {
    throw new Error('回答が空でした')
  }

  return { text: data.text, quota: data.quota ?? null }
}

export async function sendConciergeMessages(
  messages: ConciergeMessage[]
): Promise<ConciergeSendResult> {
  if (import.meta.env.DEV) {
    try {
      return await sendViaViteDevMiddleware(messages)
    } catch (e) {
      if (e instanceof DevGeminiKeyMissing) {
        return sendViaServer(messages)
      }
      throw e
    }
  }
  return sendViaServer(messages)
}

/**
 * 残りクォータの読み取り（消費しない）。Supabase RPC を直接呼ぶので
 * 認証済みなら即座に取得可能。失敗時は null を返す（UI が壊れないよう）。
 */
export async function fetchConciergeQuotaStatus(
  dailyLimit = 10
): Promise<ConciergeQuota | null> {
  try {
    const { data, error } = await supabase.rpc('get_ai_concierge_quota_status', {
      p_daily_limit: dailyLimit,
    })
    if (error) {
      console.warn('fetchConciergeQuotaStatus error:', error.message)
      return null
    }
    return (data as ConciergeQuota) ?? null
  } catch (e) {
    console.warn('fetchConciergeQuotaStatus failed:', e)
    return null
  }
}
