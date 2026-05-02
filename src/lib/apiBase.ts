/**
 * API ベース URL を一元管理するヘルパー。
 *
 * 動作仕様:
 * - dev (localhost / 127.0.0.1): 空文字列を返す → 相対パス `/api/...` で呼ぶことで
 *   Vite の proxy が自動的に `localhost:3000` の Express API サーバへ転送。
 *   これにより同一オリジン扱いとなり CORS とハードコード URL の問題を回避できる。
 * - 本番 (Vercel など): `VITE_API_BASE_URL` を最優先。未設定なら `window.location.origin`
 *   と同一オリジン (= フロントが乗っている Vercel プロジェクト) を使う。
 *
 * 旧コードでは `https://customers-three-rust.vercel.app` を多数のファイルにハードコード
 * していたが、フロントとAPIが同じVercelプロジェクトに同梱されている前提なら
 * `window.location.origin` で十分のため、ここで集約する。
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim();

const isLocalHost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
};

/**
 * `<base>/api/foo` を組み立てやすくするためのプレフィックス。
 * dev では空文字 (相対) を返す。
 */
export const getApiBaseUrl = (): string => {
  if (RAW_BASE) {
    return RAW_BASE.replace(/\/$/, '');
  }
  if (isLocalHost()) {
    return '';
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
};

/**
 * `apiUrl('/api/health')` のように使う。
 * - dev: '/api/health' (Vite proxy 経由)
 * - 本番: 'https://<host>/api/health'
 */
export const apiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  const safe = path.startsWith('/') ? path : `/${path}`;
  return `${base}${safe}`;
};
