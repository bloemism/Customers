import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  fetchIapAssignableStores,
  fetchIapPurchaseRecords,
  isIapOrdersTableMissing,
  updateIapOrderAssignment,
  type IapAssignableStore,
  type IapOrderRecord,
  type IapPurchaseLineSnapshot,
} from '../lib/iapPurchaseRepository';
import { supabaseErrorMessage } from '../lib/supabaseErrors';

const yen = (n: number) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(
    Math.round(n)
  );

const MISSING_TABLE_MESSAGE = 'まだ記録を読めません';

type AssignmentDraft = {
  storeId: string;
  marketName: string;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function lineText(lines: IapPurchaseLineSnapshot[]): string {
  if (lines.length === 0) return '（明細なし）';
  return lines
    .map((line) =>
      [line.symbol, line.item_name, line.variety_name, `${line.cases}ケース`].filter(Boolean).join(' ')
    )
    .join('\n');
}

function mailtoHref(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function customerFields(order: IapOrderRecord) {
  const snap = order.deliverySnapshot.customer;
  return {
    name: order.customerName || snap?.full_name || '',
    region: [order.prefecture || snap?.prefecture || '', order.city || snap?.city || ''].filter(Boolean).join(' '),
    postalCode: order.postalCode || snap?.postal_code || '',
    streetAddress: order.streetAddress || snap?.street_address || '',
    phone: order.phone || snap?.phone || '',
  };
}

function MailButton({ href, disabledReason }: { href: string | null; disabledReason: string | null }) {
  if (!href) {
    return (
      <button
        type="button"
        disabled
        title={disabledReason ?? undefined}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
      >
        <Mail className="w-4 h-4" aria-hidden />
        店舗へメール
      </button>
    );
  }
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
    >
      <Mail className="w-4 h-4" aria-hidden />
      店舗へメール
    </a>
  );
}

export const InAppPurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<IapOrderRecord[]>([]);
  const [stores, setStores] = useState<IapAssignableStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersUnavailable, setOrdersUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, AssignmentDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOrdersUnavailable(false);
    setDrafts({});
    try {
      const storeRows = await fetchIapAssignableStores();
      setStores(storeRows);
    } catch (e: unknown) {
      setStores([]);
      setError(supabaseErrorMessage(e) || '店舗一覧の取得に失敗しました');
    }
    try {
      const rows = await fetchIapPurchaseRecords();
      setOrders(rows);
    } catch (e: unknown) {
      setOrders([]);
      if (isIapOrdersTableMissing(e)) {
        setOrdersUnavailable(true);
      } else {
        setError(supabaseErrorMessage(e) || '注文の取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const customerOrders = useMemo(() => orders.filter((order) => order.buyerKind === 'customer'), [orders]);
  const storeOrders = useMemo(() => orders.filter((order) => order.buyerKind === 'store'), [orders]);

  useEffect(() => {
    setDrafts((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const order of customerOrders) {
        if (next[order.id]) continue;
        const store = stores.find((row) => row.id === order.assignedStoreId);
        next[order.id] = {
          storeId: order.assignedStoreId ?? '',
          marketName: order.assignedMarketName || store?.marketName || '',
        };
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customerOrders, stores]);

  const saveAssignment = async (orderId: string) => {
    const draft = drafts[orderId];
    if (!draft?.storeId) return;
    setSavingId(orderId);
    setSavedId(null);
    setError(null);
    try {
      await updateIapOrderAssignment(orderId, draft.storeId, draft.marketName);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, assignedStoreId: draft.storeId, assignedMarketName: draft.marketName.trim() }
            : order
        )
      );
      setSavedId(orderId);
    } catch (e: unknown) {
      if (isIapOrdersTableMissing(e)) {
        setError('配達店舗の保存は、注文テーブルの適用後にできます');
      } else {
        setError(supabaseErrorMessage(e) || '保存に失敗しました');
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">アプリ内販売・注文</h1>
            <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden />
              開発用。配達店舗と市場はここで決め、連絡は店舗のメールを開きます。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              再読み込み
            </button>
            <Link
              to="/dev/in-app-purchase/admin"
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-emerald-800 hover:bg-emerald-50"
            >
              商品管理へ
            </Link>
            <Link to="/dev/in-app-purchase" className="text-sm text-slate-600 hover:text-emerald-700 hover:underline">
              カタログへ
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {ordersUnavailable && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
            {MISSING_TABLE_MESSAGE}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-800">顧客の注文</h2>
          <p className="text-xs text-slate-500">住所を見て、お届けする店舗と花を受け取る市場を決めます。</p>
          {loading && orders.length === 0 && !ordersUnavailable ? (
            <p className="text-sm text-slate-500">読み込み中です…</p>
          ) : customerOrders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500 text-center">
              顧客の注文はまだありません。
            </p>
          ) : (
            <ul className="space-y-4">
              {customerOrders.map((order) => {
                const fields = customerFields(order);
                const draft = drafts[order.id] ?? { storeId: order.assignedStoreId ?? '', marketName: order.assignedMarketName };
                const selected = stores.find((store) => store.id === draft.storeId) ?? null;
                const mail = customerMailto(order, fields, selected, draft.marketName);
                return (
                  <li key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{fields.name || '氏名未設定'}</p>
                      <p className="text-xs text-slate-500">{formatWhen(order.createdAt)}</p>
                    </div>
                    <dl className="grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-1 text-sm">
                      <dt className="text-slate-500">地域</dt>
                      <dd>{fields.region || '未設定'}</dd>
                      <dt className="text-slate-500">郵便番号</dt>
                      <dd>{fields.postalCode || '未入力'}</dd>
                      <dt className="text-slate-500">住所</dt>
                      <dd>{fields.streetAddress || '未入力'}</dd>
                      <dt className="text-slate-500">電話</dt>
                      <dd>{fields.phone || '未入力'}</dd>
                    </dl>
                    <OrderLines lines={order.lines} total={order.totalYenIncTax} />
                    <label className="block text-xs text-slate-500">
                      配達店舗
                      <select
                        className="mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        value={draft.storeId}
                        onChange={(e) => {
                          const storeId = e.target.value;
                          const store = stores.find((row) => row.id === storeId);
                          setDrafts((prev) => ({
                            ...prev,
                            [order.id]: {
                              storeId,
                              marketName: store?.marketName ?? '',
                            },
                          }));
                          setSavedId(null);
                        }}
                      >
                        <option value="">未定</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.storeName}
                            {store.address ? `（${store.address}）` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs text-slate-500">
                      受け取り市場
                      <input
                        className="mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={draft.marketName}
                        onChange={(e) => {
                          const marketName = e.target.value;
                          setDrafts((prev) => ({
                            ...prev,
                            [order.id]: { storeId: draft.storeId, marketName },
                          }));
                          setSavedId(null);
                        }}
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!draft.storeId || savingId === order.id}
                        onClick={() => void saveAssignment(order.id)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {savingId === order.id ? '保存中…' : '店舗と市場を保存'}
                      </button>
                      <MailButton href={mail.href} disabledReason={mail.reason} />
                      {savedId === order.id && <span className="text-xs text-emerald-700">保存しました</span>}
                    </div>
                    {mail.reason && <p className="text-xs text-slate-500">{mail.reason}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-800">店舗の注文</h2>
          <p className="text-xs text-slate-500">注文した店舗と、受け取る市場だけを確認します。</p>
          {loading && orders.length === 0 && !ordersUnavailable ? null : storeOrders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500 text-center">
              店舗の注文はまだありません。
            </p>
          ) : (
            <ul className="space-y-4">
              {storeOrders.map((order) => {
                const snap = order.deliverySnapshot.store;
                const matched =
                  stores.find((store) => store.id === order.storeId) ??
                  stores.find((store) => snap?.trade_name && store.storeName === snap.trade_name) ??
                  null;
                const tradeName = snap?.trade_name || matched?.storeName || '店舗未設定';
                const marketName = snap?.market_name || '未記入';
                const mail = storeMailto(order, tradeName, marketName, matched?.email ?? '');
                return (
                  <li key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{tradeName}</p>
                      <p className="text-xs text-slate-500">{formatWhen(order.createdAt)}</p>
                    </div>
                    <dl className="grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-1 text-sm">
                      <dt className="text-slate-500">受け取り市場</dt>
                      <dd>{marketName}</dd>
                    </dl>
                    <OrderLines lines={order.lines} total={order.totalYenIncTax} />
                    <MailButton href={mail.href} disabledReason={mail.reason} />
                    {mail.reason && <p className="text-xs text-slate-500">{mail.reason}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

function OrderLines({ lines, total }: { lines: IapPurchaseLineSnapshot[]; total: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
      {lines.length === 0 ? (
        <p className="text-slate-500">明細なし</p>
      ) : (
        <ul className="space-y-1">
          {lines.map((line, index) => (
            <li key={`${line.symbol}-${line.item_name}-${index}`} className="flex justify-between gap-3">
              <span>
                {[line.symbol, line.item_name, line.variety_name].filter(Boolean).join(' ')} × {line.cases}ケース
              </span>
              <span className="tabular-nums text-slate-600">{yen(line.line_subtotal_yen)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-right font-semibold tabular-nums">税込 {yen(total)}</p>
    </div>
  );
}

function customerMailto(
  order: IapOrderRecord,
  fields: ReturnType<typeof customerFields>,
  store: IapAssignableStore | null,
  marketName: string
): { href: string | null; reason: string | null } {
  if (!store) return { href: null, reason: '先に配達店舗を選んでください' };
  if (!store.email) return { href: null, reason: 'この店舗にメールアドレスがありません' };
  const subject = `【87app】お届けのお願い ${fields.name || order.id.slice(0, 8)}`;
  const body = [
    'お届けをお願いします。',
    '',
    `氏名: ${fields.name || '未設定'}`,
    `地域: ${fields.region || '未設定'}`,
    `郵便番号: ${fields.postalCode || '未入力'}`,
    `住所: ${fields.streetAddress || '未入力'}`,
    `電話: ${fields.phone || '未入力'}`,
    '',
    '品目:',
    lineText(order.lines),
    '',
    `配達店舗: ${store.storeName}`,
    `受け取り市場: ${marketName || '未定'}`,
    `税込合計: ${yen(order.totalYenIncTax)}`,
  ].join('\n');
  return { href: mailtoHref(store.email, subject, body), reason: null };
}

function storeMailto(
  order: IapOrderRecord,
  tradeName: string,
  marketName: string,
  email: string
): { href: string | null; reason: string | null } {
  if (!email) return { href: null, reason: 'この店舗にメールアドレスがありません' };
  const subject = `【87app】店舗注文の確認 ${tradeName}`;
  const body = [
    '店舗からの注文です。',
    '',
    `注文店舗: ${tradeName}`,
    `受け取り市場: ${marketName}`,
    '',
    '品目:',
    lineText(order.lines),
    '',
    `税込合計: ${yen(order.totalYenIncTax)}`,
  ].join('\n');
  return { href: mailtoHref(email, subject, body), reason: null };
}

export default InAppPurchaseOrdersPage;
