import { supabase } from '../lib/supabase';

export interface RegionalStatistics {
  prefecture: string;
  store_count: number;
  total_payments: number;
  average_payment_amount: number;
  average_sales_per_store: number;
  unique_customers: number;
  average_points_used: number;
}

export interface ProductPopularity {
  flower_category: string;
  popularity_count: number;
  total_quantity_sold: number;
  /** 品目内: 按分売上合計 ÷ 本数（参考用） */
  average_unit_gross: number | null;
  /** 決済額+利用pt(1pt=1円)を明細比で按分した売上合計 */
  total_revenue: number;
  /** 互換: 旧RPC列名 */
  average_price?: number | null;
}

export interface PointsUsageStats {
  points_range: string;
  usage_count: number;
  average_payment_amount: number;
  average_points_used: number;
  points_usage_percentage: number;
}

export interface SeasonalTrends {
  month: number;
  season: string;
  payment_count: number;
  average_payment_amount: number;
  unique_customers: number;
}

export interface PaymentMethodTrends {
  payment_method: string;
  usage_count: number;
  usage_percentage: number;
  average_payment_amount: number;
  total_amount: number;
}

export class PublicRankingService {
  // 地域別統計を取得
  static async getRegionalStatistics(): Promise<RegionalStatistics[]> {
    try {
      const { data, error } = await supabase
        .from('regional_statistics_view')
        .select('*')
        .order('total_payments', { ascending: false });

      if (error) {
        console.error('地域統計取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('地域統計取得エラー:', error);
      return [];
    }
  }

  // 品目別人気ランキングを取得
  static async getProductPopularity(): Promise<ProductPopularity[]> {
    try {
      const { data, error } = await supabase
        .from('product_popularity_ranking_view')
        .select('*')
        .order('total_revenue', { ascending: false });

      if (error) {
        console.error('品目人気ランキング取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('品目人気ランキング取得エラー:', error);
      return [];
    }
  }

  // ポイント使用ランキングを取得
  static async getPointsUsageStats(): Promise<PointsUsageStats[]> {
    try {
      const { data, error } = await supabase
        .from('points_usage_ranking_view')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('ポイント使用統計取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('ポイント使用統計取得エラー:', error);
      return [];
    }
  }

  // 季節別トレンドを取得
  static async getSeasonalTrends(): Promise<SeasonalTrends[]> {
    try {
      const { data, error } = await supabase
        .from('seasonal_trends_view')
        .select('*')
        .order('month', { ascending: true });

      if (error) {
        console.error('季節別トレンド取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('季節別トレンド取得エラー:', error);
      return [];
    }
  }

  // 決済方法別トレンドを取得
  static async getPaymentMethodTrends(): Promise<PaymentMethodTrends[]> {
    try {
      const { data, error } = await supabase
        .from('payment_method_trends_view')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('決済方法トレンド取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('決済方法トレンド取得エラー:', error);
      return [];
    }
  }

  /**
   * 県別ポイントランキング（月別 or 合計）
   * `regional_points_by_month_view`（popularity_rankings_monthly_views.sql）を使用
   */
  static async getMonthlyRegionalPointsRanking(monthKey: string): Promise<{ prefecture: string; total_points: number }[]> {
    try {
      if (monthKey !== 'all') {
        const [y, m] = monthKey.split('-').map(Number);
        if (!y || !m) return [];
        const { data: monthly, error } = await supabase
          .from('regional_points_by_month_view')
          .select('prefecture, total_points')
          .eq('year', y)
          .eq('month', m)
          .order('total_points', { ascending: false });
        if (error) {
          console.warn('県別ポイント(月次):', error.message);
          return [];
        }
        return (monthly || []).map((r) => ({
          prefecture: String(r.prefecture),
          total_points: Number(r.total_points ?? 0)
        }));
      }

      const { data: rows, error } = await supabase.from('regional_points_by_month_view').select('prefecture, total_points');
      if (error) {
        console.warn('県別ポイント(合計):', error.message);
        return [];
      }
      const map = new Map<string, number>();
      for (const r of rows || []) {
        const p = String(r.prefecture);
        map.set(p, (map.get(p) || 0) + Number(r.total_points ?? 0));
      }
      return Array.from(map.entries())
        .map(([prefecture, total_points]) => ({ prefecture, total_points }))
        .sort((a, b) => b.total_points - a.total_points);
    } catch (e) {
      console.warn('県別ポイントランキング:', e);
      return [];
    }
  }

  // 地域別品目人気ランキングを取得
  static async getRegionalProductRanking(prefecture: string): Promise<ProductPopularity[]> {
    try {
      const { data, error } = await supabase.rpc('get_regional_product_ranking', {
        prefecture_param: prefecture
      });

      if (error) {
        console.error('地域別品目ランキング取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('地域別品目ランキング取得エラー:', error);
      return [];
    }
  }

  // データをフォーマット（表示用）
  static formatRegionalData(data: RegionalStatistics[]): any[] {
    return data.map(item => ({
      ...item,
      formatted_average_payment: `¥${item.average_payment_amount?.toLocaleString()}`,
      formatted_average_sales: `¥${item.average_sales_per_store?.toLocaleString()}`,
      formatted_points: `${item.average_points_used}pt`
    }));
  }

  static formatProductData(data: ProductPopularity[]): any[] {
    return data.map(item => ({
      ...item,
      formatted_average_price: `¥${item.average_price?.toLocaleString()}`,
      formatted_revenue: `¥${item.total_revenue?.toLocaleString()}`,
      popularity_percentage: Math.round((item.popularity_count / data.reduce((sum, d) => sum + d.popularity_count, 0)) * 100)
    }));
  }

  static formatPointsData(data: PointsUsageStats[]): any[] {
    return data.map(item => ({
      ...item,
      formatted_average_payment: `¥${item.average_payment_amount?.toLocaleString()}`,
      formatted_average_points: `${item.average_points_used}pt`,
      formatted_percentage: `${item.points_usage_percentage}%`
    }));
  }

  static formatSeasonalData(data: SeasonalTrends[]): any[] {
    return data.map(item => ({
      ...item,
      formatted_average_payment: `¥${item.average_payment_amount?.toLocaleString()}`,
      month_name: `${item.month}月`
    }));
  }

  static formatPaymentMethodData(data: PaymentMethodTrends[]): any[] {
    return data.map(item => ({
      ...item,
      formatted_average_payment: `¥${item.average_payment_amount?.toLocaleString()}`,
      formatted_total_amount: `¥${item.total_amount?.toLocaleString()}`,
      formatted_percentage: `${item.usage_percentage}%`,
      method_name: item.payment_method === 'stripe_connect' ? 'クレジットカード' : '現金'
    }));
  }

  // トレンド分析
  static analyzeTrends(seasonalData: SeasonalTrends[]): {
    peakSeason: string;
    peakMonth: number;
    averageGrowth: number;
  } {
    if (seasonalData.length === 0) {
      return { peakSeason: '不明', peakMonth: 0, averageGrowth: 0 };
    }

    const peakData = seasonalData.reduce((max, current) => 
      current.payment_count > max.payment_count ? current : max
    );

    const totalPayments = seasonalData.reduce((sum, item) => sum + item.payment_count, 0);
    const averagePayments = totalPayments / seasonalData.length;
    const growth = ((peakData.payment_count - averagePayments) / averagePayments) * 100;

    return {
      peakSeason: peakData.season,
      peakMonth: peakData.month,
      averageGrowth: Math.round(growth)
    };
  }
}

/** 暦月キー（人気ランキング3ヶ月比較用） */
export type YearMonthKey = { year: number; month: number };

export type MonthSliceLabel = '先々月' | '先月' | '今月';

export type LabeledMonth = YearMonthKey & { label: MonthSliceLabel };

/** アンカー月を「今月」として、その前2ヶ月と合わせた3区間 */
export function getThreeLabeledMonths(anchorYear: number, anchorMonth: number): LabeledMonth[] {
  const labels: MonthSliceLabel[] = ['先々月', '先月', '今月'];
  return [-2, -1, 0].map((offset, i) => {
    const d = new Date(anchorYear, anchorMonth - 1 + offset, 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: labels[i]!
    };
  });
}

export type PaymentMonthlyKpiRow = {
  year: number;
  month: number;
  payment_count: number;
  total_revenue: number;
  total_points_used: number;
  unique_customers: number;
  /** ranking_completed_payment_events 上の付与ポイント合計 */
  total_points_earned?: number;
  /** 利用＋付与（公開ランキングのポイント系と整合） */
  total_points_activity?: number;
  /** Σ(決済額+利用pt) 円相当（1pt=1円） */
  total_gross_sales_yen?: number;
};

export type ProductPopularityMonthRow = {
  year: number;
  month: number;
  flower_category: string;
  /** 明細行数（レシート上の行） */
  popularity_count: number;
  total_quantity_sold: number;
  average_unit_gross: number | null;
  /** 按分後グロス売上（円） */
  total_revenue: number;
};

/** flower_item_categories と一致し、月内で明細が2回以上被った商品名 × 月 */
export type ProductPopularityByNameMonthRow = {
  year: number;
  month: number;
  item_name: string;
  popularity_count: number;
  /** その月にその名前が出た店舗数（distinct store_id） */
  store_count: number;
  total_quantity_sold: number;
  average_unit_gross: number | null;
  total_revenue: number;
};

/** 店舗住所から都道府県別の月次販売 */
export type RegionalSalesMonthRow = {
  year: number;
  month: number;
  prefecture: string;
  payment_count: number;
  store_count: number;
  total_revenue_cash: number;
  total_revenue_gross: number;
};

export type RegionalPointsMonthRow = {
  year: number;
  month: number;
  prefecture: string;
  total_points: number;
  payment_count: number;
  total_revenue: number;
};

export type PointsUsageMonthRow = {
  year: number;
  month: number;
  points_range: string;
  usage_count: number;
  average_payment_amount: number;
  average_points_used: number;
  points_usage_percentage: number | null;
};

export type SeasonalYearMonthRow = {
  year: number;
  month: number;
  season: string;
  payment_count: number;
  average_payment_amount: number;
  unique_customers: number;
};

export type CustomerRankingPublicSummaryRow = {
  year: number;
  month: number;
  ranked_participant_count: number;
  avg_points_among_ranked: number;
  top_points_value: number;
  top10_slots: number;
};

export type PopularityThreeMonthBundle = {
  months: LabeledMonth[];
  kpis: (PaymentMonthlyKpiRow | null)[];
  products: ProductPopularityMonthRow[][];
  /** マスタ名が被ったものだけの月次トップ（2明細以上） */
  productsByName: ProductPopularityByNameMonthRow[][];
  regionalTop: RegionalPointsMonthRow[][];
  regionalSales: RegionalSalesMonthRow[][];
  pointsUsage: PointsUsageMonthRow[][];
  seasonal: (SeasonalYearMonthRow | null)[];
  customerSummary: (CustomerRankingPublicSummaryRow | null)[];
};

const TOP_REGIONAL = 12;
const TOP_REGIONAL_SALES = 12;
const TOP_PRODUCTS = 15;
const TOP_PRODUCT_NAMES = 25;

/** `/popularity-rankings` 用: 3ヶ月分をまとめて取得（PII なしビューのみ） */
export async function fetchPopularityThreeMonthData(
  anchorYear: number,
  anchorMonth: number
): Promise<PopularityThreeMonthBundle> {
  const months = getThreeLabeledMonths(anchorYear, anchorMonth);

  const kpiResults = await Promise.all(
    months.map((m) =>
      supabase
        .from('payment_monthly_kpis_view')
        .select('*')
        .eq('year', m.year)
        .eq('month', m.month)
        .maybeSingle()
    )
  );

  const [productResults, productByNameResults] = await Promise.all([
    Promise.all(
      months.map((m) =>
        supabase
          .from('product_popularity_by_month_view')
          .select('*')
          .eq('year', m.year)
          .eq('month', m.month)
          .order('total_revenue', { ascending: false })
          .limit(TOP_PRODUCTS)
      )
    ),
    Promise.all(
      months.map((m) =>
        supabase
          .from('product_popularity_overlap_by_name_month_view')
          .select('*')
          .eq('year', m.year)
          .eq('month', m.month)
          .order('total_revenue', { ascending: false })
          .limit(TOP_PRODUCT_NAMES)
      )
    )
  ]);

  const [regionalResults, regionalSalesResults] = await Promise.all([
    Promise.all(
      months.map((m) =>
        supabase
          .from('regional_points_by_month_view')
          .select('*')
          .eq('year', m.year)
          .eq('month', m.month)
          .order('total_points', { ascending: false })
          .limit(TOP_REGIONAL)
      )
    ),
    Promise.all(
      months.map((m) =>
        supabase
          .from('regional_sales_by_month_view')
          .select('*')
          .eq('year', m.year)
          .eq('month', m.month)
          .order('total_revenue_gross', { ascending: false })
          .limit(TOP_REGIONAL_SALES)
      )
    )
  ]);

  const pointsUsageResults = await Promise.all(
    months.map((m) =>
      supabase
        .from('points_usage_ranking_by_month_view')
        .select('*')
        .eq('year', m.year)
        .eq('month', m.month)
        .order('usage_count', { ascending: false })
    )
  );

  const seasonalResults = await Promise.all(
    months.map((m) =>
      supabase
        .from('seasonal_trends_by_year_month_view')
        .select('*')
        .eq('year', m.year)
        .eq('month', m.month)
        .maybeSingle()
    )
  );

  const { data: summaryAll } = await supabase.rpc('get_customer_rankings_monthly_summary');
  const summaryRows = (summaryAll as CustomerRankingPublicSummaryRow[] | null) ?? [];
  const customerSummary = months.map(
    (m) => summaryRows.find((r) => r.year === m.year && r.month === m.month) ?? null
  );

  return {
    months,
    kpis: kpiResults.map((r) => (r.data as PaymentMonthlyKpiRow | null) ?? null),
    products: productResults.map((r) => (r.data as ProductPopularityMonthRow[]) || []),
    productsByName: productByNameResults.map((r) => (r.data as ProductPopularityByNameMonthRow[]) || []),
    regionalTop: regionalResults.map((r) => (r.data as RegionalPointsMonthRow[]) || []),
    regionalSales: regionalSalesResults.map((r) => (r.data as RegionalSalesMonthRow[]) || []),
    pointsUsage: pointsUsageResults.map((r) => (r.data as PointsUsageMonthRow[]) || []),
    seasonal: seasonalResults.map((r) => (r.data as SeasonalYearMonthRow | null) ?? null),
    customerSummary
  };
}
