/**
 * 開発時のみ: npm run dev だけで Gemini（GEMINI_API_KEY は Node の process.env のみ）
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect } from 'vite'
import { FLOWER_CONCIERGE_SYSTEM_PROMPT } from '../src/config/flowerConciergePrompt'

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => {
      try {
        const s = Buffer.concat(chunks).toString('utf8')
        resolve(s ? (JSON.parse(s) as Record<string, unknown>) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: object) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_IMAGES_PER_MESSAGE = 4
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_TOTAL_IMAGE_BYTES = 18 * 1024 * 1024

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

function validateMessages(raw: unknown): { error?: string; contents?: { role: string; parts: GeminiPart[] }[] } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: 'messages は空でない配列である必要があります' }
  }
  if (raw.length > 24) {
    return { error: '1セッションあたりのメッセージ数が多すぎます（最大24件）' }
  }
  const contents: { role: string; parts: GeminiPart[] }[] = []
  let totalLen = 0
  let totalImageBytes = 0
  for (const m of raw) {
    if (!m || typeof m !== 'object') {
      return { error: '無効なメッセージ形式です' }
    }
    const o = m as { role?: string; text?: string; images?: unknown }
    const role = o.role
    let text = typeof o.text === 'string' ? o.text : ''
    if (role !== 'user' && role !== 'assistant') {
      return { error: 'role は user または assistant である必要があります' }
    }

    const imagesRaw = Array.isArray(o.images) ? o.images : []
    if (role === 'assistant' && imagesRaw.length > 0) {
      return { error: 'assistant メッセージに画像は付けられません' }
    }
    if (imagesRaw.length > MAX_IMAGES_PER_MESSAGE) {
      return { error: `画像は1メッセージあたり最大${MAX_IMAGES_PER_MESSAGE}枚です` }
    }

    const parts: GeminiPart[] = []
    for (const img of imagesRaw) {
      if (!img || typeof img !== 'object') {
        return { error: '無効な画像データです' }
      }
      const im = img as { mimeType?: string; data?: string }
      const mimeType = typeof im.mimeType === 'string' ? im.mimeType.trim().toLowerCase() : ''
      const data = typeof im.data === 'string' ? im.data.replace(/\s/g, '') : ''
      if (!ALLOWED_IMAGE_MIME.has(mimeType)) {
        return { error: '対応している画像形式は JPEG / PNG / WebP / GIF です' }
      }
      if (!/^[A-Za-z0-9+/]+=*$/.test(data)) {
        return { error: '画像データの形式が不正です' }
      }
      const approxBytes = Math.floor((data.length * 3) / 4)
      if (approxBytes > MAX_IMAGE_BYTES) {
        return { error: '1枚の画像が大きすぎます（解像度を下げてください）' }
      }
      totalImageBytes += approxBytes
      if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
        return { error: '送信画像の合計サイズが大きすぎます' }
      }
      parts.push({ inlineData: { mimeType, data } })
    }

    if (!text.trim() && parts.length === 0) {
      return { error: 'テキストか画像のどちらかが必要です' }
    }
    const displayText =
      text.trim() ||
      (parts.length > 0 ? 'この画像について、花・植物の観点でアドバイスをお願いします。' : '')
    if (displayText.length > 8000) {
      return { error: '1件のメッセージが長すぎます' }
    }
    totalLen += displayText.length
    if (totalLen > 48000) {
      return { error: '送信テキストの合計が長すぎます' }
    }
    parts.push({ text: displayText })

    contents.push({
      role: role === 'user' ? 'user' : 'model',
      parts,
    })
  }
  return { contents }
}

async function handleGeminiDev(
  req: IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction
): Promise<void> {
  const path = req.url?.split('?')[0] ?? ''

  if (path === '/__gemini_dev/health' && req.method === 'GET') {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
    const geminiConfigured = !!(key?.trim())
    sendJson(res, 200, {
      ok: true,
      via: 'vite-gemini-dev',
      geminiConfigured,
      ...(geminiConfigured
        ? {}
        : {
            hint:
              'プロジェクト直下の .env または .env.local に GEMINI_API_KEY=（実キー）があり、ディスクに保存されているか確認してください（エディタで追記しただけで未保存だと Vite は読めません）。保存後に npm run dev を再起動してください。',
          }),
    })
    return
  }

  if (path !== '/__gemini_dev/concierge') {
    next()
    return
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey?.trim()) {
    sendJson(res, 503, {
      success: false,
      error:
        'GEMINI_API_KEY が未設定です。.env に GEMINI_API_KEY=... を書き、npm run dev を再起動してください。',
    })
    return
  }

  let body: Record<string, unknown>
  try {
    body = await readJsonBody(req)
  } catch {
    sendJson(res, 400, { success: false, error: 'JSON 本文が不正です' })
    return
  }

  const validated = validateMessages(body.messages)
  if (validated.error) {
    sendJson(res, 400, { success: false, error: validated.error })
    return
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: FLOWER_CONCIERGE_SYSTEM_PROMPT }],
      },
      contents: validated.contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  })

  const json = (await geminiRes.json().catch(() => ({}))) as Record<string, unknown>

  if (!geminiRes.ok) {
    const errObj = json.error as { message?: string; status?: string } | undefined
    const msg =
      errObj?.message ||
      errObj?.status ||
      `Gemini API エラー (${geminiRes.status})`
    sendJson(res, 502, { success: false, error: msg })
    return
  }

  const candidates = json.candidates as
    | { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
    | undefined
  const text =
    candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''

  if (!text) {
    const reason = candidates?.[0]?.finishReason || 'unknown'
    sendJson(res, 200, {
      success: false,
      error: `回答を生成できませんでした（finish: ${reason}）`,
    })
    return
  }

  sendJson(res, 200, { success: true, text })
}

export function geminiDevMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    void handleGeminiDev(req, res as ServerResponse, next).catch((e) => {
      console.error('[vite gemini dev]', e)
      const sres = res as ServerResponse
      if (!sres.headersSent) {
        sendJson(sres, 500, { success: false, error: e instanceof Error ? e.message : String(e) })
      }
    })
  }
}
