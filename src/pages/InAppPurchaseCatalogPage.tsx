import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Package, ShieldAlert, ShoppingCart } from 'lucide-react';
import { useIapShop } from '../contexts/InAppPurchaseCartContext';
import type { CatalogViewerRole, InAppPurchaseProduct } from '../types/inAppPurchaseProduct';
import {
  b2bLineTotal,
  b2cLineTotal,
  gradeClassLabel,
  isNonStandardProduct,
  isWithinSalesPeriod,
  nonStandardGradeDescription,
} from '../types/inAppPurchaseProduct';

const yen = (n: number) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(
    Math.round(n)
  );

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(s: string): string {
  return new Date(s).toISOString();
}

function pricePerCaseB2b(p: InAppPurchaseProduct): number {
  return p.wholesalePrice * p.b2bUnitsPerCase;
}

function pricePerCaseB2c(p: InAppPurchaseProduct): number {
  return p.retailPrice * p.b2cUnitsPerCase;
}

const roleLabels: Record<CatalogViewerRole, string> = {
  store: '店舗（卸価格・B2B公開のみ）',
  customer: '一般顧客（小売価格・B2C公開のみ）',
  admin: '管理者（全商品・編集可）',
};

export const InAppPurchaseCatalogPage: React.FC = () => {
  const {
    productsLoading,
    productsError,
    saveProduct,
    viewerRole,
    setViewerRole,
    orderCases,
    setCases,
    filteredProducts: filtered,
  } = useIapShop();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const previewTotals = useMemo(() => {
    let sum = 0;
    for (const p of filtered) {
      const cases = orderCases[p.id] ?? 0;
      if (cases <= 0) continue;
      const perCase =
        viewerRole === 'store' || viewerRole === 'admin' ? pricePerCaseB2b(p) : pricePerCaseB2c(p);
      sum += perCase * cases;
    }
    const tax = Math.floor(sum * 0.1);
    return { subtotal: sum, tax, total: sum + tax };
  }, [filtered, orderCases, viewerRole]);

  const cartCaseCount = useMemo(
    () => filtered.reduce((a, p) => a + (orderCases[p.id] ?? 0), 0),
    [filtered, orderCases]
  );

  const persistFromCatalog = async (_id: string, next: InAppPurchaseProduct) => {
    await saveProduct(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 pb-28 lg:pb-10">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" aria-hidden />
            <div>
              <h1 className="text-lg font-semibold text-slate-800">アプリ内販売</h1>
              <p className="text-xs text-amber-700 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden />
                開発用・認証なし（本番ではこのURLは無効化されます）
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link
              to="/dev/in-app-purchase/cart"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 min-h-[44px]"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" aria-hidden />
              カート
              {cartCaseCount > 0 && (
                <span className="text-xs bg-white/20 px-1.5 rounded">{cartCaseCount}ケース</span>
              )}
            </Link>
            <Link
              to="/dev/in-app-purchase/admin"
              className="text-sm px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-800"
            >
              商品管理へ
            </Link>
            <Link to="/" className="text-sm text-emerald-700 hover:underline">
              ホームへ
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {productsError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {productsError}
          </div>
        )}

        {productsLoading && (
          <p className="text-sm text-slate-600 text-center py-6">カタログを読み込み中です…</p>
        )}

        {import.meta.env.DEV && (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/80 p-4">
            <p className="text-sm font-medium text-amber-900 mb-2">閲覧ロール（開発のみ）</p>
            <div className="flex flex-wrap gap-2">
              {(['store', 'customer', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setViewerRole(r)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    viewerRole === r
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  {r === 'store' ? '店舗' : r === 'customer' ? '顧客' : '管理者'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-amber-800">{roleLabels[viewerRole]}</p>
          </div>
        )}

        <section className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">送料について</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            送料は価格から引かれ、産地に支払われます。
          </p>
        </section>

        <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <h2 className="text-sm font-semibold text-slate-800">品目・価格・在庫の比較</h2>
            <p className="text-xs text-slate-500 mt-1">
              横にスクロールして一覧比較できます。在庫は Supabase の iap_catalog_stock と同期しています。
            </p>
          </div>
          <div className="overflow-x-auto -mx-px">
            <table className="min-w-[640px] w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium sticky left-0 bg-slate-100 z-[1] border-r border-slate-200">
                    品目・品種
                  </th>
                  {(viewerRole === 'store' || viewerRole === 'admin') && (
                    <>
                      <th className="px-3 py-2 font-medium whitespace-nowrap">卸 単価/本</th>
                      <th className="px-3 py-2 font-medium whitespace-nowrap">卸 ケース計</th>
                    </>
                  )}
                  {(viewerRole === 'customer' || viewerRole === 'admin') && (
                    <>
                      <th className="px-3 py-2 font-medium whitespace-nowrap">小売 単価/本</th>
                      <th className="px-3 py-2 font-medium whitespace-nowrap">小売 ケース計</th>
                    </>
                  )}
                  <th className="px-3 py-2 font-medium whitespace-nowrap">在庫</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">区分</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 sticky left-0 bg-white z-[1] border-r border-slate-100 align-top">
                      <span className="text-slate-800 font-medium">
                        {p.symbol} {p.itemName}
                      </span>
                      <span className="text-slate-500 text-xs block mt-0.5">{p.varietyName}</span>
                    </td>
                    {(viewerRole === 'store' || viewerRole === 'admin') && (
                      <>
                        <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                          {yen(p.wholesalePrice)} / {p.b2bUnitsPerCase}本
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap tabular-nums font-medium text-slate-800">
                          {yen(b2bLineTotal(p))}
                        </td>
                      </>
                    )}
                    {(viewerRole === 'customer' || viewerRole === 'admin') && (
                      <>
                        <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                          {yen(p.retailPrice)} / {p.b2cUnitsPerCase}本
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap tabular-nums font-medium text-emerald-900">
                          {yen(b2cLineTotal(p))}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{p.stockQuantity}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">{gradeClassLabel(p.gradeClass)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 py-6 text-sm">表示できる商品がありません。</p>
          )}
        </section>

        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3">商品詳細・数量</h2>
          <ul className="space-y-4">
            {filtered.map((p) => {
              const inPeriod = isWithinSalesPeriod(p);
              const expanded = expandedId === p.id;
              const casesOrdered = orderCases[p.id] ?? 0;

              return (
                <li
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex gap-3">
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="w-28 h-20 object-cover rounded-lg bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">
                          <span className="text-base text-slate-800 mr-1">{p.symbol}</span>
                          {p.itemName}
                          <span className="mx-1 text-slate-300">|</span>
                          {p.varietyName}
                          <span className="mx-1 text-slate-300">|</span>
                          {p.color}
                        </p>
                        {(p.origin || p.sizeLabel) && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            {p.origin && <span>産地: {p.origin}</span>}
                            {p.origin && p.sizeLabel && <span className="mx-1.5 text-slate-300">|</span>}
                            {p.sizeLabel && <span>サイズ: {p.sizeLabel}</span>}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.gradeClass === 'standard'
                                ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                                : 'bg-amber-100 text-amber-900 ring-1 ring-amber-200'
                            }`}
                          >
                            {gradeClassLabel(p.gradeClass)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            在庫 {p.stockQuantity}
                          </span>
                        </div>
                        {isNonStandardProduct(p) && (
                          <p className="text-xs text-amber-900/90 mt-1.5 leading-relaxed border-l-2 border-amber-400 pl-2">
                            {nonStandardGradeDescription}
                          </p>
                        )}
                        <p className="text-sm text-slate-600 mt-1 line-clamp-3">{p.description}</p>
                        {!inPeriod && <p className="text-xs text-amber-700 mt-1">販売期間外です</p>}
                        <p className="text-sm text-slate-800 mt-2">
                          {viewerRole === 'customer' && (
                            <>
                              小売 <span className="font-semibold">{yen(pricePerCaseB2c(p))}</span>
                              <span className="text-slate-500 text-xs ml-1">/ ケース</span>
                            </>
                          )}
                          {viewerRole === 'store' && (
                            <>
                              卸 <span className="font-semibold">{yen(pricePerCaseB2b(p))}</span>
                              <span className="text-slate-500 text-xs ml-1">/ ケース</span>
                            </>
                          )}
                          {viewerRole === 'admin' && (
                            <span className="text-slate-700">
                              卸 {yen(pricePerCaseB2b(p))} / ケース
                              <span className="mx-2 text-slate-300">|</span>
                              小売 {yen(pricePerCaseB2c(p))} / ケース
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 pt-1 border-t border-slate-100">
                      <label className="flex flex-col gap-1 text-sm text-slate-700">
                        <span className="text-xs text-slate-500">カートに入れるケース数</span>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          className="w-24 min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-base"
                          value={casesOrdered}
                          onChange={(e) => setCases(p.id, e.target.value)}
                          disabled={!inPeriod || p.stockQuantity <= 0}
                        />
                      </label>
                      <button
                        type="button"
                        className="min-h-[44px] px-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm font-medium hover:bg-emerald-100"
                        onClick={() => setCases(p.id, String((orderCases[p.id] ?? 0) + 1))}
                        disabled={!inPeriod || p.stockQuantity <= 0}
                      >
                        +1 ケース
                      </button>
                      <p className="text-xs text-slate-500 flex-1 min-w-[140px]">
                        店舗は複数品目をカートに載せられます。一般のお客様は1品目のみのことも多い想定です。
                      </p>
                    </div>

                    <p className="text-xs text-slate-500">
                      販売 {new Date(p.salesStartAt).toLocaleDateString('ja-JP')} 〜{' '}
                      {new Date(p.salesEndAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>

                  {viewerRole === 'admin' && (
                    <div className="border-t border-slate-100 bg-slate-50/80">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : p.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {expanded ? (
                          <>
                            編集を閉じる <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            品目・価格・本数を編集 <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      {expanded && <AdminProductEditor product={p} onSave={persistFromCatalog} />}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-900">
          <p className="font-medium">カート・お届け先・お支払いは専用ページにまとめました。</p>
          <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
            商品一覧でケース数を入れたあと、
            <Link to="/dev/in-app-purchase/cart" className="underline font-medium">
              カートページ
            </Link>
            で明細・住所・合計・Stripe（接続予定）を確認できます。スマホでも見やすい1カラムです。
          </p>
        </section>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-4xl mx-auto px-3 py-2 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">税込合計（カート）</p>
            <p className="text-lg font-bold tabular-nums text-slate-900 truncate">{yen(previewTotals.total)}</p>
            <p className="text-[10px] text-slate-400">
              {cartCaseCount > 0 ? `計 ${cartCaseCount} ケース` : 'カートは空'}
            </p>
          </div>
          <Link
            to="/dev/in-app-purchase/cart"
            className="shrink-0 min-h-[48px] px-5 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-md hover:bg-emerald-700"
          >
            カートへ
          </Link>
        </div>
      </div>
    </div>
  );
};

type AdminEditorProps = {
  product: InAppPurchaseProduct;
  onSave: (id: string, next: InAppPurchaseProduct) => Promise<void>;
};

const AdminProductEditor: React.FC<AdminEditorProps> = ({ product, onSave }) => {
  const [draft, setDraft] = useState<InAppPurchaseProduct>(product);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setDraft(product);
  }, [product]);

  const n = (key: keyof InAppPurchaseProduct) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setDraft((d) => ({ ...d, [key]: v }));
  };

  const num = (key: keyof InAppPurchaseProduct) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === '' ? 0 : Number(e.target.value);
    setDraft((d) => ({ ...d, [key]: Number.isFinite(v) ? v : 0 }));
  };

  const bool = (key: 'isPublished' | 'isPublicB2b' | 'isPublicB2c') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((d) => ({ ...d, [key]: e.target.checked }));
  };

  const apply = async () => {
    const next: InAppPurchaseProduct = {
      ...draft,
      wholesalePrice: Number(draft.wholesalePrice) || 0,
      retailPrice: Number(draft.retailPrice) || 0,
      b2bUnitsPerCase: Math.max(0, Math.floor(Number(draft.b2bUnitsPerCase) || 0)),
      b2bCaseCount: Math.max(0, Math.floor(Number(draft.b2bCaseCount) || 0)),
      b2cUnitsPerCase: Math.max(0, Math.floor(Number(draft.b2cUnitsPerCase) || 0)),
      b2cCaseCount: Math.max(0, Math.floor(Number(draft.b2cCaseCount) || 0)),
      stockQuantity: Math.max(0, Math.floor(Number(draft.stockQuantity) || 0)),
      taxRate: 0.1,
      gradeClass: draft.gradeClass === 'non_standard' ? 'non_standard' : 'standard',
      origin: draft.origin,
      sizeLabel: draft.sizeLabel,
    };
    setSaving(true);
    try {
      await onSave(product.id, next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pb-4 space-y-3 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-slate-600 sm:col-span-2">
          記号
          <input className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.symbol} onChange={n('symbol')} />
        </label>
        <label className="text-xs text-slate-600">
          品目名
          <input className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.itemName} onChange={n('itemName')} />
        </label>
        <label className="text-xs text-slate-600">
          品種名
          <input className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.varietyName} onChange={n('varietyName')} />
        </label>
        <label className="text-xs text-slate-600 sm:col-span-2">
          色
          <input className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.color} onChange={n('color')} />
        </label>
        <label className="text-xs text-slate-600 sm:col-span-2">
          産地
          <input className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.origin} onChange={n('origin')} />
        </label>
        <label className="text-xs text-slate-600 sm:col-span-2">
          サイズ
          <input className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.sizeLabel} onChange={n('sizeLabel')} />
        </label>
        <div className="sm:col-span-2 space-y-1">
          <span className="text-xs text-slate-600">区分</span>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
            {(['standard', 'non_standard'] as const).map((gc) => (
              <button
                key={gc}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, gradeClass: gc }))}
                className={`flex-1 rounded-md px-2 py-2 text-sm font-medium ${
                  draft.gradeClass === gc
                    ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-600'
                }`}
              >
                {gradeClassLabel(gc)}
              </button>
            ))}
          </div>
          {draft.gradeClass === 'non_standard' && (
            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-100 rounded px-2 py-1">
              {nonStandardGradeDescription}
            </p>
          )}
        </div>
        <label className="text-xs text-slate-600 sm:col-span-2">
          画像URL
          <input className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-xs" value={draft.imageUrl} onChange={n('imageUrl')} />
        </label>
        <label className="text-xs text-slate-600 sm:col-span-2">
          商品説明
          <textarea className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 min-h-[72px]" value={draft.description} onChange={n('description')} />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 border-t border-slate-200 pt-3">
        <p className="text-xs font-semibold text-slate-700 sm:col-span-2">卸（B2B）</p>
        <label className="text-xs text-slate-600">
          単価
          <input type="number" className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.wholesalePrice} onChange={num('wholesalePrice')} />
        </label>
        <label className="text-xs text-slate-600">
          1ケース本数
          <input type="number" className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.b2bUnitsPerCase} onChange={num('b2bUnitsPerCase')} />
        </label>
        <label className="text-xs text-slate-600 sm:col-span-2">
          ケース数
          <input type="number" className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.b2bCaseCount} onChange={num('b2bCaseCount')} />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 border-t border-slate-200 pt-3">
        <p className="text-xs font-semibold text-slate-700 sm:col-span-2">小売（B2C）</p>
        <label className="text-xs text-slate-600">
          単価
          <input type="number" className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.retailPrice} onChange={num('retailPrice')} />
        </label>
        <label className="text-xs text-slate-600">
          1ケース本数
          <input type="number" className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.b2cUnitsPerCase} onChange={num('b2cUnitsPerCase')} />
        </label>
        <label className="text-xs text-slate-600 sm:col-span-2">
          ケース数
          <input type="number" className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.b2cCaseCount} onChange={num('b2cCaseCount')} />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 border-t border-slate-200 pt-3">
        <label className="text-xs text-slate-600">
          在庫数
          <input type="number" className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5" value={draft.stockQuantity} onChange={num('stockQuantity')} />
        </label>
        <label className="text-xs text-slate-600 sm:col-span-2 flex items-center gap-2 mt-5">
          <input type="checkbox" checked={draft.isPublished} onChange={bool('isPublished')} />
          公開状態（公開）
        </label>
        <label className="text-xs text-slate-600 flex items-center gap-2">
          <input type="checkbox" checked={draft.isPublicB2b} onChange={bool('isPublicB2b')} />
          B2B カタログに掲載
        </label>
        <label className="text-xs text-slate-600 flex items-center gap-2">
          <input type="checkbox" checked={draft.isPublicB2c} onChange={bool('isPublicB2c')} />
          B2C カタログに掲載
        </label>
        <label className="text-xs text-slate-600 sm:col-span-2">
          販売開始
          <input
            type="datetime-local"
            className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5"
            value={toDatetimeLocalValue(draft.salesStartAt)}
            onChange={(e) => setDraft((d) => ({ ...d, salesStartAt: fromDatetimeLocalValue(e.target.value) }))}
          />
        </label>
        <label className="text-xs text-slate-600 sm:col-span-2">
          販売終了
          <input
            type="datetime-local"
            className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5"
            value={toDatetimeLocalValue(draft.salesEndAt)}
            onChange={(e) => setDraft((d) => ({ ...d, salesEndAt: fromDatetimeLocalValue(e.target.value) }))}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void apply()}
        disabled={saving}
        className="w-full rounded-lg bg-emerald-600 text-white py-2 font-medium hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? '保存中…' : 'この内容を反映（DB保存）'}
      </button>
    </div>
  );
};

export default InAppPurchaseCatalogPage;
