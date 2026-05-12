/** PostgrestError 等、Supabase が投げるプレーンオブジェクトを人が読める1行にする */
export function supabaseErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (!err || typeof err !== 'object') return String(err);
  const o = err as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof o.message === 'string' && o.message) parts.push(o.message);
  if (typeof o.details === 'string' && o.details) parts.push(o.details);
  if (typeof o.hint === 'string' && o.hint) parts.push(`ヒント: ${o.hint}`);
  if (typeof o.code === 'string' && o.code) parts.push(`コード: ${o.code}`);
  return parts.join(' — ') || '不明なエラー';
}
