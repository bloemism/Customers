/** PostgrestError 等（Error インスタンスでない）を画面表示用に文字列化する */
export function supabaseErrorMessage(err: unknown): string {
  if (err == null) return '不明なエラー';
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object') {
    const o = err as Record<string, unknown>;
    const m = o.message != null ? String(o.message) : '';
    const d = o.details != null ? String(o.details) : '';
    const h = o.hint != null ? String(o.hint) : '';
    const c = o.code != null ? String(o.code) : '';
    const parts = [m, d, h, c].filter((x) => x.length > 0);
    if (parts.length) return parts.join(' — ');
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
