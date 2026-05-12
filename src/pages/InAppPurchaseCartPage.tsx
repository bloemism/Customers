import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Package, ShoppingCart } from 'lucide-react';
import { useIapShop } from '../contexts/InAppPurchaseCartContext';
import {
  insertIapPurchaseRecord,
  type IapPurchaseDeliverySnapshot,
} from '../lib/iapPurchaseRepository';
import { supabaseErrorMessage } from '../lib/supabaseErrors';
import type { CatalogViewerRole, InAppPurchaseProduct } from '../types/inAppPurchaseProduct';

const yen = (n: number) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(
    Math.round(n)
  );

function pricePerCaseB2b(p: InAppPurchaseProduct): number {
  return p.wholesalePrice * p.b2bUnitsPerCase;
}

function pricePerCaseB2c(p: InAppPurchaseProduct): number {
  return p.retailPrice * p.b2cUnitsPerCase;
}

type CartLine = {
  product: InAppPurchaseProduct;
  cases: number;
  unitPerCase: number;
  lineSubtotal: number;
};

const roleLabels: Record<CatalogViewerRole, string> = {
  store: '店舗（卸価格）',
  customer: '一般顧客（小売価格）',
  admin: '管理者（卸で試算）',
};

export const InAppPurchaseCartPage: React.FC = () => {
  const {
    viewerRole,
    orderCases,
    setCases,
    customerParty,
    setCustomerParty,
    storeParty,
    setStoreParty,
    filteredProducts,
    linkedCustomerId,
    linkedStoreId,
    clearCartLines,
  } = useIapShop();

  const [recordSaving, setRecordSaving] = useState(false);
  const [recordMessage, setRecordMessage] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  const cartSubtotal = useMemo(() => {
    let sum = 0;
    for (const p of filteredProducts) {
      const cases = orderCases[p.id] ?? 0;
      if (cases <= 0) continue;
      const perCase =
        viewerRole === 'store' || viewerRole === 'admin' ? pricePerCaseB2b(p) : pricePerCaseB2c(p);
      sum += perCase * cases;
    }
    return sum;
  }, [filteredProducts, orderCases, viewerRole]);

  const taxAmount = Math.floor(cartSubtotal * 0.1);
  const cartTotal = cartSubtotal + taxAmount;

  const cartLines: CartLine[] = useMemo(() => {
    const lines: CartLine[] = [];
    for (const p of filteredProducts) {
      const cases = orderCases[p.id] ?? 0;
      if (cases <= 0) continue;
      const unitPerCase =
        viewerRole === 'store' || viewerRole === 'admin' ? pricePerCaseB2b(p) : pricePerCaseB2c(p);
      lines.push({ product: p, cases, unitPerCase, lineSubtotal: unitPerCase * cases });
    }
    return lines;
  }, [filteredProducts, orderCases, viewerRole]);

  const cartCaseCount = cartLines.reduce((a, l) => a + l.cases, 0);
  const showCustomerBlock = viewerRole === 'customer' || viewerRole === 'admin';
  const showStoreBlock = viewerRole === 'store' || viewerRole === 'admin';

  const recordPurchase = useCallback(async () => {
    if (cartLines.length === 0) return;
    setRecordSaving(true);
    setRecordError(null);
    setRecordMessage(null);
    const buyerKind: 'customer' | 'store' | 'admin_dev' =
      viewerRole === 'store' ? 'store' : viewerRole === 'admin' ? 'admin_dev' : 'customer';
    const customerId =
      viewerRole === 'customer' || viewerRole === 'admin' ? linkedCustomerId : null;
    const storeId = viewerRole === 'store' || viewerRole === 'admin' ? linkedStoreId : null;
    const deliverySnapshot: IapPurchaseDeliverySnapshot = {
      customer: {
        full_name: customerParty.fullName,
        phone: customerParty.phone,
        address: customerParty.address,
        customer_code: customerParty.customerCode,
      },
      store: {
        trade_name: storeParty.tradeName,
        store_code: storeParty.storeCode,
        market_name: storeParty.marketName,
      },
    };
    const linesSnapshot = cartLines.map((l) => ({
      symbol: l.product.symbol,
      item_name: l.product.itemName,
      variety_name: l.product.varietyName,
      cases: l.cases,
    }));
    try {
      const id = await insertIapPurchaseRecord({
        buyerKind,
        viewerRole,
        customerId,
        storeId,
        deliverySnapshot,
        linesSnapshot,
        subtotalYenExTax: cartSubtotal,
        taxYen: taxAmount,
        totalYenIncTax: cartTotal,
      });
      setRecordMessage(`記録しました（記録ID: ${id.slice(0, 8)}…）`);
      clearCartLines();
    } catch (e: unknown) {
      setRecordError(supabaseErrorMessage(e) || '記録に失敗しました');
    } finally {
      setRecordSaving(false);
    }
  }, [
    cartLines,
    cartSubtotal,
    taxAmount,
    cartTotal,
    viewerRole,
    linkedCustomerId,
    linkedStoreId,
    customerParty,
    storeParty,
    clearCartLines,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 pb-10">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/dev/in-app-purchase"
            className="inline-flex items-center gap-1 text-sm text-emerald-800 font-medium hover:underline shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            商品一覧
          </Link>
          <div className="flex-1 min-w-0 flex items-center gap-2 justify-end">
            <ShoppingCart className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
            <h1 className="text-base font-semibold text-slate-800 truncate">カート・お支払い</h1>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Package className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {roleLabels[viewerRole]} — ロールは商品一覧の開発用切替に連動しています。
        </p>

        {(linkedCustomerId || linkedStoreId) && (
          <p className="text-xs rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900 px-3 py-2 leading-relaxed">
            {linkedCustomerId && <>顧客ログイン: <code className="text-[11px]">customers</code> の氏名・電話・住所・顧客コードをカートに反映しました。 </>}
            {linkedStoreId && <>店舗ログイン: <code className="text-[11px]">stores</code> の屋号・コード・届け先市場名を反映しました。</>}
            内容は編集可能です。
          </p>
        )}

        <section className="rounded-2xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="px-4 py-3 bg-slate-800 text-white">
            <h2 className="text-sm font-semibold">カート明細</h2>
          </div>
          <div className="p-4">
            {cartLines.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                カートに商品がありません。
                <Link to="/dev/in-app-purchase" className="block mt-3 text-emerald-700 font-medium hover:underline">
                  商品一覧でケース数を入れる
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {cartLines.map(({ product: p, cases, unitPerCase, lineSubtotal }) => (
                  <li
                    key={p.id}
                    className="px-3 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {p.symbol} {p.itemName}{' '}
                        <span className="text-slate-500 font-normal">/ {p.varietyName}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {yen(unitPerCase)} ×{' '}
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            className="w-16 min-h-[44px] rounded border border-slate-200 px-2 text-sm text-center"
                            value={cases}
                            onChange={(e) => setCases(p.id, e.target.value)}
                          />
                          ケース
                        </label>
                      </p>
                    </div>
                    <p className="text-base font-semibold tabular-nums text-slate-900 sm:text-right">
                      {yen(lineSubtotal)}
                      <span className="text-xs font-normal text-slate-500 block sm:inline sm:ml-2">税抜小計</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {showCustomerBlock && (
          <section className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">お届け先（顧客）</h2>
            <div className="grid gap-3">
              <label className="block text-xs text-slate-500">
                氏名
                <input
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-base"
                  value={customerParty.fullName}
                  onChange={(e) => setCustomerParty((s) => ({ ...s, fullName: e.target.value }))}
                  autoComplete="name"
                />
              </label>
              <label className="block text-xs text-slate-500">
                電話番号
                <input
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-base"
                  value={customerParty.phone}
                  onChange={(e) => setCustomerParty((s) => ({ ...s, phone: e.target.value }))}
                  autoComplete="tel"
                />
              </label>
              <label className="block text-xs text-slate-500">
                顧客コード
                <input
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-base"
                  value={customerParty.customerCode}
                  onChange={(e) => setCustomerParty((s) => ({ ...s, customerCode: e.target.value }))}
                />
              </label>
              <label className="block text-xs text-slate-500">
                住所
                <input
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-base"
                  value={customerParty.address}
                  onChange={(e) => setCustomerParty((s) => ({ ...s, address: e.target.value }))}
                  autoComplete="street-address"
                />
              </label>
            </div>
          </section>
        )}

        {showStoreBlock && (
          <section className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">店舗情報</h2>
            <div className="grid gap-3">
              <label className="block text-xs text-slate-500">
                屋号
                <input
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-base"
                  value={storeParty.tradeName}
                  onChange={(e) => setStoreParty((s) => ({ ...s, tradeName: e.target.value }))}
                />
              </label>
              <label className="block text-xs text-slate-500">
                店舗コード
                <input
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-base"
                  value={storeParty.storeCode}
                  onChange={(e) => setStoreParty((s) => ({ ...s, storeCode: e.target.value }))}
                />
              </label>
              <label className="block text-xs text-slate-500">
                届け先市場名
                <input
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-base"
                  value={storeParty.marketName}
                  onChange={(e) => setStoreParty((s) => ({ ...s, marketName: e.target.value }))}
                />
              </label>
            </div>
          </section>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
          {viewerRole === 'admin' && (
            <p className="text-xs text-slate-500 pb-1">管理者: 合計は卸（B2B）単価で試算（検証用）</p>
          )}
          <div className="flex justify-between text-slate-600 text-sm">
            <span>小計（税抜）</span>
            <span className="tabular-nums font-medium">{yen(cartSubtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-sm">
            <span>消費税（10%）</span>
            <span className="tabular-nums font-medium">{yen(taxAmount)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
            <span className="text-lg font-semibold text-slate-900">合計（税込）</span>
            <span className="text-2xl font-bold tabular-nums text-emerald-900">{yen(cartTotal)}</span>
          </div>
          {cartCaseCount > 0 && (
            <p className="text-xs text-slate-500">計 {cartCaseCount} ケース</p>
          )}
          <p className="text-xs text-slate-500 pt-1">
            購入記録には税込合計・税抜小計・消費税・届け先スナップショット・各行の記号・品目・品種・ケース数が残ります（単価は保存しません）。
          </p>
        </div>

        {recordError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {recordError}
          </div>
        )}
        {recordMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {recordMessage}
          </div>
        )}

        <button
          type="button"
          disabled={recordSaving || cartLines.length === 0}
          onClick={() => void recordPurchase()}
          className="w-full min-h-[52px] rounded-xl bg-emerald-700 text-white text-base font-semibold shadow hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          <ClipboardCheck className="w-5 h-5 shrink-0" aria-hidden />
          {recordSaving ? '記録中…' : '購入を記録（iap_purchase_records）'}
        </button>
        <p className="text-xs text-slate-500 leading-relaxed -mt-2">
          開発用: Supabase テーブル <code className="text-[11px]">iap_purchase_records</code> に1行 INSERT し、カート明細を空にします。Stripe
          決済は別途接続予定です。
        </p>

        <button
          type="button"
          disabled
          className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-slate-100 text-slate-600 text-sm font-medium opacity-80 cursor-not-allowed"
          title="未接続"
        >
          Stripe で支払う（接続予定）
        </button>

        <Link to="/" className="block text-center text-sm text-slate-600 hover:text-emerald-700 py-2">
          ホームへ
        </Link>
      </div>
    </div>
  );
};

export default InAppPurchaseCartPage;
