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
  average_price: number;
  total_revenue: number;
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
        .order('popularity_count', { ascending: false });

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
