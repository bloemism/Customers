/**
 * 87app — AI Flower Concierge（Gemini）
 * 会話はサーバーに保存しない。リクエスト単位で Gemini に渡すのみ。
 *
 * セキュリティ層:
 *   1. CORS（既存）
 *   2. IP レートリミット（インメモリ：60req/h, 200req/day）
 *   3. Supabase Auth JWT 必須（Authorization: Bearer <token>）
 *   4. ユーザーごと 1日10回までのクォータ（Supabase RPC で原子的に消費）
 *   5. 入力サイズ・画像数・テキスト量の上限（既存）
 *
 * 環境変数:
 *   GEMINI_API_KEY            — Google AI Studio の API キー（必須）
 *   GEMINI_MODEL              — 既定: gemini-2.5-flash
 *   VITE_SUPABASE_URL         — Supabase URL（JWT 検証＋RPC 呼び出し用）
 *   VITE_SUPABASE_ANON_KEY    — Supabase anon key（JWT 検証＋RPC 呼び出し用）
 *   AI_CONCIERGE_DAILY_LIMIT  — 既定: 10
 */

import { createClient } from '@supabase/supabase-js';

const SYSTEM_PROMPT = `あなたは「87app」のフラワー・コンシェルジュアシスタントです。花と緑に関する問い合わせやアドバイスを、親しみやく専門的に行ってください。

【扱う範囲】
- 病害虫の見分け・予防・対処の考え方（農薬の具体的処方や診断断定は避け、必要なら専門家・販売店へ）
- ガーデニング、切り花、鉢花、観葉植物、鉢植えの管理・水やり・置き場所・光・温度・湿度
- 植え替え、用土・肥料の考え方、季節の手入れ
- 花言葉、季節の花の知識、花贈りの用途・シーン別のマナーと注意（宗教・文化差には配慮）
- 花店・フラワーショップでの注文の仕方（伝え方、予算感、指定のコツ、受け取り・日持ちの希望の伝え方など）
- 色彩・香り・日持ち・フォルムなどを踏まえた選び方
- 地域や文化によって異なる花の習慣・タブーへの配慮（一般論を示し、確信が持てないときは地域差があることを明記）

【提案の仕方】
- お客様の用途、ライフスタイル、置き場所、予算感、贈る相手・シーンが分かるようであれば、それに合わせて複数の「良い条件」を提案し、それぞれ簡潔な説明（なぜその選択が向くか）を添える。
- 暦・季節・行事に合わせた花の選び方も提案してよい。
- 観葉植物や鉢植えの悩み（土、根、葉、虫、カビ、徒長など）は、考えられる原因と試せる対策を段階的に示す。

【トーンと安全】
- 主に日本語で、読みやすく実用的に。専門用語は必要に応じて短く補足。
- 医療診断・法律判断・投資助言はしない。植物の毒性やアレルギーなど健康に関わる話では、一般情報にとどめ確実でない旨を伝える。
- 情報が不十分なときは、確認したい質問を返してよい。
- 画像が送られた場合は、写っている植物・花・葉・土・鉢などを観察し、分かる範囲で説明・助言する。品種の断定や病害虫の確定診断は避け、不明点は質問で補う。`;

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGES_PER_MESSAGE = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 18 * 1024 * 1024;

const DEFAULT_DAILY_LIMIT = Number.parseInt(process.env.AI_CONCIERGE_DAILY_LIMIT || '10', 10) || 10;

// ---------------------------------------------------------------------------
// IP レートリミット（インメモリ・プロセス単位の予備防御層）
//   JWT 認証を主防御として置きつつ、未認証や異常な多発呼び出しを早期遮断
//   Vercel など複数インスタンスでは完全ではないが、コスト暴走の歯止めになる
// ---------------------------------------------------------------------------
const IP_LIMIT_PER_HOUR = 60;
const IP_LIMIT_PER_DAY = 200;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const ipBucket = new Map(); // ip -> { hourStart, hourCount, dayStart, dayCount }

function checkIpRateLimit(ip) {
  if (!ip) return { allowed: true };
  const now = Date.now();
  let b = ipBucket.get(ip);
  if (!b) {
    b = { hourStart: now, hourCount: 0, dayStart: now, dayCount: 0 };
    ipBucket.set(ip, b);
  }
  if (now - b.hourStart > HOUR_MS) {
    b.hourStart = now;
    b.hourCount = 0;
  }
  if (now - b.dayStart > DAY_MS) {
    b.dayStart = now;
    b.dayCount = 0;
  }
  if (b.hourCount >= IP_LIMIT_PER_HOUR) {
    return { allowed: false, reason: 'IP からのリクエストが多すぎます（1時間あたり）' };
  }
  if (b.dayCount >= IP_LIMIT_PER_DAY) {
    return { allowed: false, reason: 'IP からのリクエストが多すぎます（1日あたり）' };
  }
  b.hourCount += 1;
  b.dayCount += 1;
  // 古いエントリの掃除（1万件超えたら半分捨てる — 厳密 LRU でなくて良い）
  if (ipBucket.size > 10000) {
    let i = 0;
    for (const k of ipBucket.keys()) {
      ipBucket.delete(k);
      if (++i > 5000) break;
    }
  }
  return { allowed: true };
}

function getClientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '';
}

// ---------------------------------------------------------------------------
// Supabase クライアント（JWT 検証＋RPC 呼び出し用）
// ---------------------------------------------------------------------------
function getSupabaseUrlAndKey() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return { url, anonKey };
}

function getUserScopedSupabaseClient(jwt) {
  const { url, anonKey } = getSupabaseUrlAndKey();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

function extractBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (typeof h === 'string' && h.toLowerCase().startsWith('bearer ')) {
    const token = h.slice(7).trim();
    if (token) return token;
  }
  return null;
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
function cors(res) {
  // server-local では先に express の cors() が Allow-Origin を付ける。* と二重にすると失敗することがある
  try {
    if (typeof res.getHeader === 'function' && res.getHeader('Access-Control-Allow-Origin')) {
      return;
    }
  } catch (_) {
    /* ignore */
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ---------------------------------------------------------------------------
// 入力バリデーション（既存ロジック）
// ---------------------------------------------------------------------------
function validateMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: 'messages は空でない配列である必要があります' };
  }
  if (raw.length > 24) {
    return { error: '1セッションあたりのメッセージ数が多すぎます（最大24件）' };
  }
  const contents = [];
  let totalLen = 0;
  let totalImageBytes = 0;
  for (let i = 0; i < raw.length; i++) {
    const m = raw[i];
    if (!m || typeof m !== 'object') {
      return { error: '無効なメッセージ形式です' };
    }
    const role = m.role;
    let text = typeof m.text === 'string' ? m.text : '';
    if (role !== 'user' && role !== 'assistant') {
      return { error: 'role は user または assistant である必要があります' };
    }
    const imagesRaw = Array.isArray(m.images) ? m.images : [];
    if (role === 'assistant' && imagesRaw.length > 0) {
      return { error: 'assistant メッセージに画像は付けられません' };
    }
    if (imagesRaw.length > MAX_IMAGES_PER_MESSAGE) {
      return { error: `画像は1メッセージあたり最大${MAX_IMAGES_PER_MESSAGE}枚です` };
    }
    const parts = [];
    for (const img of imagesRaw) {
      if (!img || typeof img !== 'object') {
        return { error: '無効な画像データです' };
      }
      const mimeType = typeof img.mimeType === 'string' ? img.mimeType.trim().toLowerCase() : '';
      const data = typeof img.data === 'string' ? img.data.replace(/\s/g, '') : '';
      if (!ALLOWED_IMAGE_MIME.has(mimeType)) {
        return { error: '対応している画像形式は JPEG / PNG / WebP / GIF です' };
      }
      if (!/^[A-Za-z0-9+/]+=*$/.test(data)) {
        return { error: '画像データの形式が不正です' };
      }
      const approxBytes = Math.floor((data.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        return { error: '1枚の画像が大きすぎます（解像度を下げてください）' };
      }
      totalImageBytes += approxBytes;
      if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
        return { error: '送信画像の合計サイズが大きすぎます' };
      }
      parts.push({ inlineData: { mimeType, data } });
    }
    if (!text.trim() && parts.length === 0) {
      return { error: 'テキストか画像のどちらかが必要です' };
    }
    const displayText =
      text.trim() ||
      (parts.length > 0 ? 'この画像について、花・植物の観点でアドバイスをお願いします。' : '');
    if (displayText.length > 8000) {
      return { error: '1件のメッセージが長すぎます' };
    }
    totalLen += displayText.length;
    if (totalLen > 48000) {
      return { error: '送信テキストの合計が長すぎます' };
    }
    parts.push({ text: displayText });
    contents.push({
      role: role === 'user' ? 'user' : 'model',
      parts,
    });
  }
  return { contents };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const safeJson = (status, payload) => {
    try {
      if (typeof res.status === 'function') {
        return res.status(status).json(payload);
      }
    } catch (sendErr) {
      console.error('gemini-concierge safeJson failed:', sendErr);
    }
  };

  try {
    cors(res);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return safeJson(405, { error: 'Method not allowed', success: false });
    }

    // ── (1) IP レートリミット（早期遮断）
    const ip = getClientIp(req);
    const ipCheck = checkIpRateLimit(ip);
    if (!ipCheck.allowed) {
      return safeJson(429, {
        success: false,
        error: ipCheck.reason || 'リクエストが多すぎます',
        rateLimited: true,
      });
    }

    // ── (2) Gemini API キー
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return safeJson(503, {
        success: false,
        error:
          'GEMINI_API_KEY がサーバーに設定されていません。プロジェクト直下の .env を確認し、npm run dev:full を再起動してください。',
      });
    }

    // ── (3) Supabase JWT 必須
    const jwt = extractBearerToken(req);
    if (!jwt) {
      return safeJson(401, {
        success: false,
        error: 'ログインが必要です（認証トークンが見つかりません）。',
        unauthorized: true,
      });
    }

    const supabase = getUserScopedSupabaseClient(jwt);
    if (!supabase) {
      return safeJson(503, {
        success: false,
        error:
          'Supabase 設定（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）が不足しています。サーバー環境変数を確認してください。',
      });
    }

    // JWT を検証してユーザー情報を取得
    const { data: userInfo, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userInfo?.user?.id) {
      return safeJson(401, {
        success: false,
        error: '認証トークンが無効です。再ログインしてからお試しください。',
        unauthorized: true,
      });
    }

    // ── (4) クォータ消費（原子的）
    const { data: quotaResult, error: quotaErr } = await supabase.rpc(
      'try_consume_ai_concierge_quota',
      { p_daily_limit: DEFAULT_DAILY_LIMIT }
    );
    if (quotaErr) {
      console.error('gemini-concierge quota RPC error:', quotaErr);
      return safeJson(500, {
        success: false,
        error: 'クォータ確認に失敗しました。時間をおいて再度お試しください。',
      });
    }
    if (!quotaResult?.allowed) {
      return safeJson(429, {
        success: false,
        error:
          quotaResult?.reason ||
          `本日の利用上限（${DEFAULT_DAILY_LIMIT}回）に達しました。明日また使えます。`,
        rateLimited: true,
        quota: quotaResult || null,
      });
    }

    // ── (5) 入力バリデーション
    const { messages } = req.body || {};
    const validated = validateMessages(messages);
    if (validated.error) {
      return safeJson(400, { success: false, error: validated.error, quota: quotaResult });
    }

    // ── (6) Gemini 呼び出し
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: validated.contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    const json = await geminiRes.json().catch(() => ({}));

    if (!geminiRes.ok) {
      const msg =
        json?.error?.message ||
        json?.error?.status ||
        `Gemini API エラー (${geminiRes.status})`;
      console.error('gemini-concierge API error:', geminiRes.status, msg);
      return safeJson(502, {
        success: false,
        error: msg,
        quota: quotaResult,
      });
    }

    const text =
      json?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('') || '';

    if (!text) {
      const reason = json?.candidates?.[0]?.finishReason || 'unknown';
      return safeJson(200, {
        success: false,
        error: `回答を生成できませんでした（finish: ${reason}）`,
        quota: quotaResult,
      });
    }

    return safeJson(200, { success: true, text, quota: quotaResult });
  } catch (e) {
    console.error('gemini-concierge:', e);
    return safeJson(500, {
      success: false,
      error: e?.message || String(e),
    });
  }
}
