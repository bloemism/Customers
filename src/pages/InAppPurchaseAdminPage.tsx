import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCopy, LayoutList, Plus, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import { useIapShop } from '../contexts/InAppPurchaseCartContext';
import { isPersistedIapCatalogId } from '../lib/iapCatalogRepository';
import {
  b2bLineTotal,
  b2cLineTotal,
  gradeClassLabel,
  nonStandardGradeDescription,
  type InAppPurchaseProduct,
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

export const InAppPurchaseAdminPage: React.FC = () => {
  const {
    products,
    productsLoading,
    productsSaving,
    productsError,
    refreshProducts,
    patchProduct,
    addCatalogRow,
    registerDraftProduct,
    removeCatalogRow,
  } = useIapShop();
  const [copyDone, setCopyDone] = useState(false);

  const patch = useCallback(
    (id: string, partial: Partial<InAppPurchaseProduct>) => {
      patchProduct(id, partial);
    },
    [patchProduct]
  );

  const remove = useCallback(
    async (id: string) => {
      await removeCatalogRow(id);
    },
    [removeCatalogRow]
  );

  const addRow = useCallback(() => {
    addCatalogRow();
  }, [addCatalogRow]);

  const registerById = useCallback(
    (id: string) => {
      const cur = products.find((x) => x.id === id);
      if (cur) void registerDraftProduct(cur);
    },
    [products, registerDraftProduct]
  );

  const copyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(products, null, 2));
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-emerald-600" aria-hidden />
              アプリ内販売・商品管理
            </h1>
            <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden />
              開発用・認証なし。新規は入力後「この内容で新規登録」で DB に反映。既存行は入力後しばらくで自動保存されます。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshProducts()}
              disabled={productsLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} aria-hidden />
              再読み込み
            </button>
            <Link
              to="/dev/in-app-purchase"
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-emerald-800 hover:bg-emerald-50"
            >
              カタログで確認
            </Link>
            <Link to="/" className="text-sm text-slate-600 hover:text-emerald-700 hover:underline">
              ホームへ
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {productsError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {productsError}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={addRow}
            disabled={productsSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" aria-hidden />
            {productsSaving ? '登録中…' : '入力用の空行を追加'}
          </button>
          <button
            type="button"
            onClick={copyJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ClipboardCopy className="w-4 h-4" aria-hidden />
            {copyDone ? 'コピーしました' : 'JSONをコピー'}
          </button>
          <span className="text-xs text-slate-500">
            全 {products.length} 件{productsLoading ? '（読み込み中）' : ''}
          </span>
        </div>

        <div className="space-y-6">
          {products.map((p, index) => (
            <article
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-700">#{index + 1}</span>
                  {!isPersistedIapCatalogId(p.id) && (
                    <span className="text-xs font-medium text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                      下書き（未登録）
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400 truncate max-w-[min(200px,40vw)]" title={p.id}>
                  {isPersistedIapCatalogId(p.id) ? p.id : '保存後に UUID が付与されます'}
                </span>
                <button
                  type="button"
                  title={isPersistedIapCatalogId(p.id) ? 'Supabase から削除' : '下書きを破棄（DB 未保存）'}
                  onClick={() => void remove(p.id)}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                  削除
                </button>
              </div>

              <div className="p-4 grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">品目・表示</p>
                  <div className="grid grid-cols-4 gap-2">
                    <label className="col-span-1 text-xs text-slate-600">
                      記号
                      <input
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={p.symbol}
                        onChange={(e) => patch(p.id, { symbol: e.target.value })}
                      />
                    </label>
                    <label className="col-span-3 text-xs text-slate-600">
                      品目名
                      <input
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={p.itemName}
                        onChange={(e) => patch(p.id, { itemName: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="block text-xs text-slate-600">
                    品種名（商品名）
                    <input
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                      value={p.varietyName}
                      onChange={(e) => patch(p.id, { varietyName: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-slate-600">
                    色
                    <input
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                      value={p.color}
                      onChange={(e) => patch(p.id, { color: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-slate-600">
                    産地
                    <input
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                      value={p.origin}
                      onChange={(e) => patch(p.id, { origin: e.target.value })}
                      placeholder="例: 長野県、○○農園"
                    />
                  </label>
                  <label className="block text-xs text-slate-600">
                    サイズ
                    <input
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                      value={p.sizeLabel}
                      onChange={(e) => patch(p.id, { sizeLabel: e.target.value })}
                      placeholder="例: 60cm、L"
                    />
                  </label>
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-600">区分</span>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
                      {(['standard', 'non_standard'] as const).map((gc) => (
                        <button
                          key={gc}
                          type="button"
                          onClick={() => patch(p.id, { gradeClass: gc })}
                          className={`flex-1 rounded-md px-2 py-2 text-sm font-medium transition ${
                            p.gradeClass === gc
                              ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-slate-200/80'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {gradeClassLabel(gc)}
                        </button>
                      ))}
                    </div>
                    {p.gradeClass === 'non_standard' && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                        {nonStandardGradeDescription}
                      </p>
                    )}
                  </div>
                  <label className="block text-xs text-slate-600">
                    画像URL（任意）
                    <input
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-xs font-mono"
                      value={p.imageUrl}
                      onChange={(e) => patch(p.id, { imageUrl: e.target.value })}
                      placeholder="空欄で写真なし"
                    />
                  </label>
                  <label className="block text-xs text-slate-600">
                    商品説明
                    <textarea
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm min-h-[72px]"
                      value={p.description}
                      onChange={(e) => patch(p.id, { description: e.target.value })}
                    />
                  </label>
                </div>

                <div className="lg:col-span-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">卸（B2B）</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-600">
                      単価（円）
                      <input
                        type="number"
                        min={0}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={p.wholesalePrice}
                        onChange={(e) => patch(p.id, { wholesalePrice: Number(e.target.value) || 0 })}
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      1ケース本数
                      <input
                        type="number"
                        min={0}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={p.b2bUnitsPerCase}
                        onChange={(e) =>
                          patch(p.id, { b2bUnitsPerCase: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                        }
                      />
                    </label>
                    <label className="text-xs text-slate-600 col-span-2">
                      ケース数
                      <input
                        type="number"
                        min={0}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={p.b2bCaseCount}
                        onChange={(e) =>
                          patch(p.id, { b2bCaseCount: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                        }
                      />
                    </label>
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                    ケース合計（参考） <span className="font-semibold">{yen(b2bLineTotal(p))}</span>
                  </p>
                </div>

                <div className="lg:col-span-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">小売（B2C）</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-600">
                      価格（円）
                      <input
                        type="number"
                        min={0}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={p.retailPrice}
                        onChange={(e) => patch(p.id, { retailPrice: Number(e.target.value) || 0 })}
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      1ケース本数
                      <input
                        type="number"
                        min={0}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={p.b2cUnitsPerCase}
                        onChange={(e) =>
                          patch(p.id, { b2cUnitsPerCase: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                        }
                      />
                    </label>
                    <label className="text-xs text-slate-600 col-span-2">
                      ケース数
                      <input
                        type="number"
                        min={0}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={p.b2cCaseCount}
                        onChange={(e) =>
                          patch(p.id, { b2cCaseCount: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                        }
                      />
                    </label>
                  </div>
                  <p className="text-sm text-slate-700 bg-emerald-50/60 rounded-lg px-3 py-2 border border-emerald-100">
                    合計（参考） <span className="font-semibold">{yen(b2cLineTotal(p))}</span>
                  </p>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold text-slate-500">在庫・公開・販売期間</p>
                    <label className="block text-xs text-slate-600">
                      在庫数
                      <input
                        type="number"
                        min={0}
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={p.stockQuantity}
                        onChange={(e) =>
                          patch(p.id, { stockQuantity: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                        }
                      />
                    </label>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.isPublished}
                          onChange={(e) => patch(p.id, { isPublished: e.target.checked })}
                        />
                        公開
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.isPublicB2b}
                          onChange={(e) => patch(p.id, { isPublicB2b: e.target.checked })}
                        />
                        B2B掲載
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.isPublicB2c}
                          onChange={(e) => patch(p.id, { isPublicB2c: e.target.checked })}
                        />
                        B2C掲載
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">税率 10%（標準税率）— 保存時は固定 0.1</p>
                    <label className="block text-xs text-slate-600">
                      販売開始
                      <input
                        type="datetime-local"
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={toDatetimeLocalValue(p.salesStartAt)}
                        onChange={(e) => patch(p.id, { salesStartAt: fromDatetimeLocalValue(e.target.value) })}
                      />
                    </label>
                    <label className="block text-xs text-slate-600">
                      販売終了
                      <input
                        type="datetime-local"
                        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={toDatetimeLocalValue(p.salesEndAt)}
                        onChange={(e) => patch(p.id, { salesEndAt: fromDatetimeLocalValue(e.target.value) })}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {!isPersistedIapCatalogId(p.id) && (
                <div className="px-4 py-3 bg-amber-50/90 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-amber-950 leading-relaxed">
                    品目・品種・産地などを入力してから、下のボタンで初めて Supabase に保存されます（この時点では DB にはありません）。
                  </p>
                  <button
                    type="button"
                    disabled={productsSaving}
                    onClick={() => registerById(p.id)}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
                  >
                    {productsSaving ? '登録中…' : 'この内容で新規登録（Supabaseへ）'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>

        {products.length === 0 && !productsLoading && (
          <p className="text-center text-slate-500 py-12 rounded-xl border border-dashed border-slate-300 bg-white text-sm leading-relaxed max-w-xl mx-auto px-4">
            商品がありません。0件はデータ未登録の正常状態です。「入力用の空行を追加」でフォームを出し、入力後「この内容で新規登録」で Supabase に保存してください。
            <span className="block mt-2 text-amber-800/90">
              一覧取得がタイムアウトする場合は、データ件数ではなく接続の問題です。.env の VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が、マイグレーションを当てたプロジェクトと一致しているか確認してください。
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default InAppPurchaseAdminPage;
