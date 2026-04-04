import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Flower2,
  Gift,
  MapPin,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import {
  fetchPopularityThreeMonthData,
  getThreeLabeledMonths,
  type PopularityThreeMonthBundle,
  type ProductPopularityByNameMonthRow,
  type ProductPopularityMonthRow,
  type RegionalSalesMonthRow
} from '../services/publicRankingService';

const COLORS = {
  bg: '#FAF8F5',
  header: '#5C6B4A',
  text: '#2D2A26',
  muted: '#8A857E',
  border: '#E0D6C8',
  card: 'rgba(255,255,255,0.95)',
  accentSoft: '#E8EDE4'
};

function ymLabel(y: number, m: number): string {
  return `${y}年${m}月`;
}

/** 3ヶ月分の品目名の和集合で行を作り、各月の数値を埋める（本数・明細行・按分グロス売上） */
function buildProductPivot(
  productCols: ProductPopularityMonthRow[][]
): { category: string; cells: { lineCount: number; qty: number; revenue: number }[] }[] {
  const catSet = new Set<string>();
  productCols.forEach((col) => col.forEach((r) => catSet.add(r.flower_category)));
  const categories = Array.from(catSet).filter((c) => c !== 'その他');
  categories.sort((a, b) => a.localeCompare(b, 'ja'));
  if (catSet.has('その他')) categories.push('その他');

  return categories.map((category) => ({
    category,
    cells: productCols.map((col) => {
      const row = col.find((r) => r.flower_category === category);
      return {
        lineCount: row ? Number(row.popularity_count) : 0,
        qty: row ? Number(row.total_quantity_sold) : 0,
        revenue: row ? Number(row.total_revenue) : 0
      };
    })
  }));
}

/** マスタ一致かつ被り名の和集合で行を作る */
function buildNamePivot(nameCols: ProductPopularityByNameMonthRow[][]) {
  const nameSet = new Set<string>();
  nameCols.forEach((col) => col.forEach((r) => nameSet.add(r.item_name)));
  const names = Array.from(nameSet).sort((a, b) => a.localeCompare(b, 'ja'));
  return names.map((item_name) => ({
    item_name,
    cells: nameCols.map((col) => {
      const row = col.find((r) => r.item_name === item_name);
      return {
        count: row ? Number(row.popularity_count) : 0,
        revenue: row ? Number(row.total_revenue) : 0,
        qty: row ? Number(row.total_quantity_sold) : 0,
        stores: row ? Number(row.store_count ?? 0) : 0
      };
    })
  }));
}

const PopularityRankings: React.FC = () => {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<PopularityThreeMonthBundle | null>(null);

  const labeledMonths = useMemo(
    () => getThreeLabeledMonths(anchor.year, anchor.month),
    [anchor.year, anchor.month]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPopularityThreeMonthData(anchor.year, anchor.month);
      setBundle(data);
    } catch (e) {
      console.error(e);
      setError('データの取得に失敗しました。しばらくしてから再度お試しください。');
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [anchor.year, anchor.month]);

  useEffect(() => {
    load();
  }, [load]);

  const productPivot = useMemo(
    () => (bundle ? buildProductPivot(bundle.products) : []),
    [bundle]
  );

  const namePivot = useMemo(
    () => (bundle ? buildNamePivot(bundle.productsByName) : []),
    [bundle]
  );

  const shiftAnchor = (delta: number) => {
    const d = new Date(anchor.year, anchor.month - 1 + delta, 1);
    setAnchor({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };

  const hasAnyData =
    bundle &&
    (bundle.kpis.some((k) => k && (k.payment_count > 0 || k.total_revenue > 0)) ||
      bundle.products.some((p) => p.length > 0) ||
      bundle.productsByName.some((p) => p.length > 0) ||
      bundle.regionalSales.some((p) => p.length > 0) ||
      bundle.regionalTop.some((p) => p.length > 0) ||
      bundle.pointsUsage.some((p) => p.length > 0));

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <header
        className="sticky top-0 z-20 border-b shadow-sm"
        style={{ backgroundColor: COLORS.header, borderColor: COLORS.border }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-sm transition-opacity hover:opacity-80"
              style={{ color: '#fff' }}
              aria-label="戻る"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1
                className="text-lg sm:text-xl font-semibold tracking-tight"
                style={{ color: '#fff', fontFamily: "'Noto Serif JP', serif" }}
              >
                人気ランキング
              </h1>
              <p className="text-xs sm:text-sm opacity-90" style={{ color: '#F5F0E8' }}>
                先々月・先月・今月の集計（カテゴリ・商品名・地域・ポイント）
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftAnchor(-1)}
              className="px-2 py-1 text-sm rounded-sm"
              style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              ←
            </button>
            <span className="text-sm flex items-center gap-1 px-2" style={{ color: '#fff' }}>
              <Calendar className="w-4 h-4 opacity-90" />
              基準: {ymLabel(anchor.year, anchor.month)}
            </span>
            <button
              type="button"
              onClick={() => shiftAnchor(1)}
              className="px-2 py-1 text-sm rounded-sm"
              style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              →
            </button>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-sm text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#fff', color: COLORS.header }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div
            className="mb-6 p-4 rounded-sm text-sm"
            style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}
          >
            {error}
          </div>
        )}

        {loading && !bundle ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div
              className="w-10 h-10 border-2 rounded-full animate-spin"
              style={{ borderColor: COLORS.border, borderTopColor: COLORS.header }}
            />
            <p className="text-sm" style={{ color: COLORS.muted }}>
              読み込み中…
            </p>
          </div>
        ) : bundle ? (
          <>
            {/* 3ヶ月KPI */}
            <section className="mb-10">
              <h2
                className="text-base font-semibold mb-4 flex items-center gap-2"
                style={{ color: COLORS.text, fontFamily: "'Noto Serif JP', serif" }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: COLORS.header }} />
                月次サマリー（数値のみ）
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {labeledMonths.map((lm, i) => {
                  const k = bundle.kpis[i];
                  return (
                    <div
                      key={`${lm.year}-${lm.month}`}
                      className="rounded-sm p-5 border"
                      style={{
                        backgroundColor: COLORS.card,
                        borderColor: COLORS.border
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: COLORS.header }}>
                        {lm.label}
                      </div>
                      <div className="text-sm mb-3" style={{ color: COLORS.muted }}>
                        {ymLabel(lm.year, lm.month)}
                      </div>
                      {!k ? (
                        <p className="text-sm" style={{ color: COLORS.muted }}>
                          データなし
                        </p>
                      ) : (
                        <ul className="space-y-2 text-sm" style={{ color: COLORS.text }}>
                          <li className="flex justify-between gap-2">
                            <span style={{ color: COLORS.muted }}>決済件数</span>
                            <span className="font-medium tabular-nums">
                              {Number(k.payment_count).toLocaleString('ja-JP')} 件
                            </span>
                          </li>
                          <li className="flex justify-between gap-2">
                            <span style={{ color: COLORS.muted }}>売上合計（現金等・決済額）</span>
                            <span className="font-medium tabular-nums">
                              ¥{Number(k.total_revenue).toLocaleString('ja-JP')}
                            </span>
                          </li>
                          {k.total_gross_sales_yen != null && (
                            <li className="flex justify-between gap-2">
                              <span style={{ color: COLORS.muted }}>グロス（決済＋利用pt×1円）</span>
                              <span className="font-medium tabular-nums">
                                ¥{Number(k.total_gross_sales_yen).toLocaleString('ja-JP')}
                              </span>
                            </li>
                          )}
                          <li className="flex justify-between gap-2">
                            <span style={{ color: COLORS.muted }}>利用ポイント合計</span>
                            <span className="font-medium tabular-nums">
                              {Number(k.total_points_used).toLocaleString('ja-JP')} pt
                            </span>
                          </li>
                          <li className="flex justify-between gap-2">
                            <span style={{ color: COLORS.muted }}>付与ポイント合計</span>
                            <span className="font-medium tabular-nums">
                              {Number(k.total_points_earned ?? 0).toLocaleString('ja-JP')} pt
                            </span>
                          </li>
                          <li className="flex justify-between gap-2">
                            <span style={{ color: COLORS.muted }}>利用＋付与（活動合計）</span>
                            <span className="font-medium tabular-nums">
                              {Number(
                                k.total_points_activity ??
                                  Number(k.total_points_used) + Number(k.total_points_earned ?? 0)
                              ).toLocaleString('ja-JP')}{' '}
                              pt
                            </span>
                          </li>
                          <li className="flex justify-between gap-2">
                            <span style={{ color: COLORS.muted }}>ユニーク顧客（ID数）</span>
                            <span className="font-medium tabular-nums">
                              {Number(k.unique_customers).toLocaleString('ja-JP')}
                            </span>
                          </li>
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 品目 */}
            <section className="mb-10">
              <h2
                className="text-base font-semibold mb-4 flex items-center gap-2"
                style={{ color: COLORS.text, fontFamily: "'Noto Serif JP', serif" }}
              >
                <Flower2 className="w-5 h-5" style={{ color: COLORS.header }} />
                品目カテゴリ別（本数・売上）
              </h2>
              <p className="text-sm mb-3" style={{ color: COLORS.muted }}>
                上位表示は<strong>按分グロス売上</strong>（その決済の「決済額＋利用ポイント（1pt=1円）」を、明細の金額比で各行に配分）の多い順です。
                <strong>本数</strong>は明細の quantity 合計、<strong>明細行</strong>はレシート行の件数です。
              </p>
              <div
                className="rounded-sm border overflow-x-auto"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
              >
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: COLORS.accentSoft }}>
                      <th className="text-left p-3 font-medium" style={{ color: COLORS.text }}>
                        品目
                      </th>
                      {labeledMonths.map((lm) => (
                        <th key={`h-${lm.year}-${lm.month}`} className="p-3 text-right font-medium" style={{ color: COLORS.text }}>
                          {lm.label}
                          <div className="text-xs font-normal" style={{ color: COLORS.muted }}>
                            本数 / 明細 / グロス売上
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productPivot.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center" style={{ color: COLORS.muted }}>
                          この期間の品目データがありません
                        </td>
                      </tr>
                    ) : (
                      productPivot.map((row) => (
                        <tr key={row.category} className="border-t" style={{ borderColor: COLORS.border }}>
                          <td className="p-3 font-medium" style={{ color: COLORS.text }}>
                            {row.category}
                          </td>
                          {row.cells.map((c, j) => (
                            <td key={j} className="p-3 text-right tabular-nums" style={{ color: COLORS.text }}>
                              {c.lineCount > 0 || c.qty > 0 || c.revenue > 0 ? (
                                <>
                                  <div className="font-medium">{c.qty.toLocaleString('ja-JP')} 本</div>
                                  <div className="text-xs" style={{ color: COLORS.muted }}>
                                    明細 {c.lineCount.toLocaleString('ja-JP')} 行
                                  </div>
                                  <div className="text-xs" style={{ color: COLORS.muted }}>
                                    ¥{c.revenue.toLocaleString('ja-JP')}
                                  </div>
                                </>
                              ) : (
                                <span style={{ color: COLORS.muted }}>—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 商品名（明細の name 原文） */}
            <section className="mb-10">
              <h2
                className="text-base font-semibold mb-4 flex items-center gap-2"
                style={{ color: COLORS.text, fontFamily: "'Noto Serif JP', serif" }}
              >
                <Flower2 className="w-5 h-5" style={{ color: COLORS.header }} />
                被り商品名ランキング（マスタ一致）
              </h2>
              <p className="text-sm mb-3" style={{ color: COLORS.muted }}>
                flower_item_categories の有効マスタ名（前後空白無視・英大文字小文字無視）と一致する明細だけを対象に、その月で
                <strong>2回以上</strong>売上明細に出た名前だけをランキングします。売上は品目表と同じく按分グロス（決済額＋利用pt）です。各月上位25件まで表示します。
              </p>
              <div
                className="rounded-sm border overflow-x-auto"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
              >
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: COLORS.accentSoft }}>
                      <th className="text-left p-3 font-medium" style={{ color: COLORS.text }}>
                        商品名
                      </th>
                      {labeledMonths.map((lm) => (
                        <th
                          key={`nh-${lm.year}-${lm.month}`}
                          className="p-3 text-right font-medium"
                          style={{ color: COLORS.text }}
                        >
                          {lm.label}
                          <div className="text-xs font-normal" style={{ color: COLORS.muted }}>
                            件数 / 店舗数 / 本数 / 売上
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {namePivot.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center" style={{ color: COLORS.muted }}>
                          条件を満たすデータがありません（マスタ名と明細の一致、同一月2明細以上が必要です）
                        </td>
                      </tr>
                    ) : (
                      namePivot.map((row) => (
                        <tr key={row.item_name} className="border-t" style={{ borderColor: COLORS.border }}>
                          <td className="p-3 font-medium max-w-[220px]" style={{ color: COLORS.text }}>
                            <span className="break-words">{row.item_name}</span>
                          </td>
                          {row.cells.map((c, j) => (
                            <td key={j} className="p-3 text-right tabular-nums" style={{ color: COLORS.text }}>
                              {c.count > 0 || c.revenue > 0 ? (
                                <>
                                  <div>{c.count.toLocaleString('ja-JP')} 件</div>
                                  <div className="text-xs" style={{ color: COLORS.muted }}>
                                    {c.stores.toLocaleString('ja-JP')} 店
                                  </div>
                                  <div className="text-xs" style={{ color: COLORS.muted }}>
                                    {c.qty.toLocaleString('ja-JP')} 本
                                  </div>
                                  <div className="text-xs" style={{ color: COLORS.muted }}>
                                    ¥{c.revenue.toLocaleString('ja-JP')}
                                  </div>
                                </>
                              ) : (
                                <span style={{ color: COLORS.muted }}>—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 地域販売（店舗住所） */}
            <section className="mb-10">
              <h2
                className="text-base font-semibold mb-4 flex items-center gap-2"
                style={{ color: COLORS.text, fontFamily: "'Noto Serif JP', serif" }}
              >
                <MapPin className="w-5 h-5" style={{ color: COLORS.header }} />
                地域別販売ランキング（店舗の都道府県）
              </h2>
              <p className="text-sm mb-3" style={{ color: COLORS.muted }}>
                <code className="text-[11px]">stores.address</code> から都道府県を抽出し、その月の決済を集計しています。上位は
                <strong>グロス売上</strong>（決済額＋利用pt×1円）の多い順です。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {labeledMonths.map((lm, i) => {
                  const rows: RegionalSalesMonthRow[] = bundle.regionalSales[i] || [];
                  return (
                    <div
                      key={`rs-${lm.year}-${lm.month}`}
                      className="rounded-sm border p-4"
                      style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
                    >
                      <div className="text-xs font-medium mb-2" style={{ color: COLORS.header }}>
                        {lm.label} · {ymLabel(lm.year, lm.month)}
                      </div>
                      {rows.length === 0 ? (
                        <p className="text-sm" style={{ color: COLORS.muted }}>
                          データなし
                        </p>
                      ) : (
                        <ol className="space-y-2">
                          {rows.map((r, idx) => (
                            <li
                              key={`${r.prefecture}-${idx}`}
                              className="flex flex-col gap-0.5 text-sm border-b border-dashed pb-2 last:border-0"
                              style={{ borderColor: COLORS.border, color: COLORS.text }}
                            >
                              <div className="flex justify-between gap-2">
                                <span>
                                  <span className="tabular-nums mr-2" style={{ color: COLORS.muted }}>
                                    {idx + 1}.
                                  </span>
                                  {r.prefecture}
                                </span>
                                <span className="tabular-nums font-medium shrink-0">
                                  ¥{Number(r.total_revenue_gross).toLocaleString('ja-JP')}
                                </span>
                              </div>
                              <div className="text-xs tabular-nums pl-5" style={{ color: COLORS.muted }}>
                                現金等 ¥{Number(r.total_revenue_cash).toLocaleString('ja-JP')} ·{' '}
                                {Number(r.payment_count).toLocaleString('ja-JP')} 件 ·{' '}
                                {Number(r.store_count).toLocaleString('ja-JP')} 店
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 地域ポイント */}
            <section className="mb-10">
              <h2
                className="text-base font-semibold mb-4 flex items-center gap-2"
                style={{ color: COLORS.text, fontFamily: "'Noto Serif JP', serif" }}
              >
                <MapPin className="w-5 h-5" style={{ color: COLORS.header }} />
                地域別（都道府県）ポイント・決済
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {labeledMonths.map((lm, i) => {
                  const rows = bundle.regionalTop[i] || [];
                  return (
                    <div
                      key={`reg-${lm.year}-${lm.month}`}
                      className="rounded-sm border p-4"
                      style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
                    >
                      <div className="text-xs font-medium mb-2" style={{ color: COLORS.header }}>
                        {lm.label} · {ymLabel(lm.year, lm.month)}
                      </div>
                      {rows.length === 0 ? (
                        <p className="text-sm" style={{ color: COLORS.muted }}>
                          データなし
                        </p>
                      ) : (
                        <ol className="space-y-2">
                          {rows.map((r, idx) => (
                            <li
                              key={r.prefecture}
                              className="flex justify-between gap-2 text-sm"
                              style={{ color: COLORS.text }}
                            >
                              <span>
                                <span className="tabular-nums mr-2" style={{ color: COLORS.muted }}>
                                  {idx + 1}.
                                </span>
                                {r.prefecture}
                              </span>
                              <span className="tabular-nums font-medium shrink-0">
                                {Number(r.total_points).toLocaleString('ja-JP')} pt
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ポイント利用帯 */}
            <section className="mb-10">
              <h2
                className="text-base font-semibold mb-4 flex items-center gap-2"
                style={{ color: COLORS.text, fontFamily: "'Noto Serif JP', serif" }}
              >
                <Gift className="w-5 h-5" style={{ color: COLORS.header }} />
                ポイント利用額の分布
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {labeledMonths.map((lm, i) => {
                  const rows = bundle.pointsUsage[i] || [];
                  return (
                    <div
                      key={`pu-${lm.year}-${lm.month}`}
                      className="rounded-sm border p-4"
                      style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
                    >
                      <div className="text-xs font-medium mb-2" style={{ color: COLORS.header }}>
                        {lm.label} · {ymLabel(lm.year, lm.month)}
                      </div>
                      {rows.length === 0 ? (
                        <p className="text-sm" style={{ color: COLORS.muted }}>
                          データなし
                        </p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {rows.map((r) => (
                            <li key={r.points_range} className="flex justify-between gap-2" style={{ color: COLORS.text }}>
                              <span style={{ color: COLORS.muted }}>{r.points_range}</span>
                              <span className="tabular-nums font-medium">
                                {Number(r.usage_count).toLocaleString('ja-JP')} 件
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* customer_rankings 集計（匿名） */}
            <section className="mb-10">
              <h2
                className="text-base font-semibold mb-4 flex items-center gap-2"
                style={{ color: COLORS.text, fontFamily: "'Noto Serif JP', serif" }}
              >
                <BarChart3 className="w-5 h-5" style={{ color: COLORS.header }} />
                ポイント利用ランキング参加傾向（匿名集計）
              </h2>
              <p className="text-xs mb-3" style={{ color: COLORS.muted }}>
                customer_rankings は月次スナップショットです（
                <code className="text-[11px]">ranking_completed_payment_events</code> 上の利用＋付与の合算）。
                KPI・品目・地域も同じイベントビューをソースにしています。
                空の月は月末運用で{' '}
                <code className="text-[11px]">refresh_customer_rankings(年, 月)</code> を service_role で実行してください（手順は docs/RANKING_MONTH_END.md）。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {labeledMonths.map((lm, i) => {
                  const s = bundle.customerSummary[i];
                  return (
                    <div
                      key={`cr-${lm.year}-${lm.month}`}
                      className="rounded-sm border p-4"
                      style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
                    >
                      <div className="text-xs font-medium mb-2" style={{ color: COLORS.header }}>
                        {lm.label} · {ymLabel(lm.year, lm.month)}
                      </div>
                      {!s || Number(s.ranked_participant_count) === 0 ? (
                        <p className="text-sm" style={{ color: COLORS.muted }}>
                          集計データなし
                        </p>
                      ) : (
                        <ul className="space-y-2 text-sm" style={{ color: COLORS.text }}>
                          <li className="flex justify-between gap-2">
                            <span style={{ color: COLORS.muted }}>ランキング対象者数</span>
                            <span className="tabular-nums font-medium">
                              {Number(s.ranked_participant_count).toLocaleString('ja-JP')}
                            </span>
                          </li>
                          <li className="flex justify-between gap-2">
                            <span style={{ color: COLORS.muted }}>平均（利用＋付与）</span>
                            <span className="tabular-nums font-medium">
                              {Number(s.avg_points_among_ranked).toLocaleString('ja-JP')} pt
                            </span>
                          </li>
                          <li className="flex justify-between gap-2">
                            <span style={{ color: COLORS.muted }}>上位のポイント幅（最大）</span>
                            <span className="tabular-nums font-medium">
                              {Number(s.top_points_value).toLocaleString('ja-JP')} pt
                            </span>
                          </li>
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 季節（年×月） */}
            <section className="mb-6">
              <h2
                className="text-base font-semibold mb-4 flex items-center gap-2"
                style={{ color: COLORS.text, fontFamily: "'Noto Serif JP', serif" }}
              >
                <Calendar className="w-5 h-5" style={{ color: COLORS.header }} />
                季節・月次トレンド（決済件数）
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {labeledMonths.map((lm, i) => {
                  const s = bundle.seasonal[i];
                  return (
                    <div
                      key={`se-${lm.year}-${lm.month}`}
                      className="rounded-sm border p-4"
                      style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
                    >
                      <div className="text-xs font-medium mb-2" style={{ color: COLORS.header }}>
                        {lm.label} · {ymLabel(lm.year, lm.month)}
                      </div>
                      {!s ? (
                        <p className="text-sm" style={{ color: COLORS.muted }}>
                          データなし
                        </p>
                      ) : (
                        <ul className="space-y-1 text-sm" style={{ color: COLORS.text }}>
                          <li>
                            季節: <strong>{s.season}</strong>
                          </li>
                          <li className="tabular-nums">
                            決済: {Number(s.payment_count).toLocaleString('ja-JP')} 件
                          </li>
                          <li className="tabular-nums" style={{ color: COLORS.muted }}>
                            平均単価: ¥{Number(s.average_payment_amount).toLocaleString('ja-JP')}
                          </li>
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {!hasAnyData && (
              <p className="text-center text-sm py-8" style={{ color: COLORS.muted }}>
                この基準月付近の決済データがまだありません。データが溜まると自動的に表示されます。
              </p>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
};

export default PopularityRankings;
