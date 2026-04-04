/** Gemini へ送る画像（base64、プレフィックスなし） */
export type ConciergeImagePayload = { mimeType: string; data: string }

export type ConciergeMessage =
  | { role: 'user'; text: string; images?: ConciergeImagePayload[] }
  | { role: 'assistant'; text: string }

const DEV_CONCIERGE_PATH = '/__gemini_dev/concierge'

function parseJsonResponse(
  raw: string,
  response: Response
): { success?: boolean; text?: string; error?: string } {
  try {
    return JSON.parse(raw) as { success?: boolean; text?: string; error?: string }
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

async function sendViaViteDevMiddleware(
  messages: ConciergeMessage[]
): Promise<string> {
  let response: Response
  try {
    response = await fetch(DEV_CONCIERGE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`開発用 Gemini ルートに接続できません（${msg}）。`)
  }

  const raw = await response.text()
  const data = parseJsonResponse(raw, response)

  if (response.status === 503) {
    throw new DevGeminiKeyMissing(data.error)
  }

  if (!response.ok || !data.success) {
    const base = data.error || `リクエストに失敗しました (${response.status})`
    throw new Error(base)
  }

  if (!data.text?.trim()) {
    throw new Error('回答が空でした')
  }

  return data.text
}

/** Vite プロセスに GEMINI_API_KEY が無いとき、サーバー API へフォールバックするためのシグナル */
class DevGeminiKeyMissing extends Error {
  constructor(message?: string) {
    super(message || 'GEMINI_API_KEY が Vite に見えていません')
    this.name = 'DevGeminiKeyMissing'
  }
}

/**
 * Gemini コンシェルジュ API の URL（本番・dev:full のサーバー経由用）
 */
export function getConciergeRequestUrl(): string {
  const path = '/api/gemini-concierge'
  if (import.meta.env.DEV) {
    return path
  }
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (base) {
    return `${base}${path}`
  }
  return path
}

async function sendViaServer(messages: ConciergeMessage[]): Promise<string> {
  const url = getConciergeRequestUrl()

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  if (!response.ok || !data.success) {
    const base = data.error || `リクエストに失敗しました (${response.status})`
    throw new Error(base)
  }

  if (!data.text) {
    throw new Error('回答が空でした')
  }

  return data.text
}

export async function sendConciergeMessages(
  messages: ConciergeMessage[]
): Promise<string> {
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
