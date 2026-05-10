/**
 * customers.birth_date（date）や RPC 向けに、YYYY-MM-DD または null に正規化する。
 * 日本語表記・ISO 先頭10文字以外は null（無効値で PostgREST が 400 になるのを防ぐ）。
 */
export function normalizeBirthDateForDb(raw: string | undefined | null): string | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const jp = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (jp) {
    return `${jp[1]}-${jp[2].padStart(2, '0')}-${jp[3].padStart(2, '0')}`;
  }

  const head = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (head) return head[1];

  return null;
}
