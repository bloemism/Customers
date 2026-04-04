import type { ConciergeImagePayload } from '../services/geminiConciergeService'

/** コンシェルジュ送信用: 長辺を抑えて JPEG/PNG に寄せ、base64（data URL プレフィックスなし）を返す */
const MAX_EDGE = 1536
const JPEG_QUALITY = 0.88
const MAX_FILE_BYTES = 12 * 1024 * 1024

export async function fileToConciergeImage(file: File): Promise<ConciergeImagePayload> {
  if (!file.type.startsWith('image/')) {
    throw new Error('画像ファイルを選んでください')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('画像は12MB以下にしてください')
  }

  const bitmap = await createImageBitmap(file)
  try {
    let w = bitmap.width
    let h = bitmap.height
    if (w > MAX_EDGE || h > MAX_EDGE) {
      const s = MAX_EDGE / Math.max(w, h)
      w = Math.round(w * s)
      h = Math.round(h * s)
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('画像を処理できませんでした')
    }
    ctx.drawImage(bitmap, 0, 0, w, h)

    const usePng = file.type === 'image/png'
    const mimeType = usePng ? 'image/png' : 'image/jpeg'
    const dataUrl = usePng
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    const comma = dataUrl.indexOf(',')
    const data = comma >= 0 ? dataUrl.slice(comma + 1) : ''
    if (!data) {
      throw new Error('画像のエンコードに失敗しました')
    }
    return { mimeType, data }
  } finally {
    bitmap.close()
  }
}
