import { supabase } from '../lib/supabase';

export interface StoreRankingData {
  rank: number;
  store_id: string;
  store_name: string;
  total_sales: number;
  total_payments: number;
  unique_customers: number;
  average_payment: number;
  last_payment_date: string;
}

export interface CustomerRankingData {
  rank: number;
  customer_id: string;
  customer_name: string;
  total_spent: number;
  total_payments: number;
  average_payment: number;
  total_points_used: number;
  last_payment_date: string;
}

export interface MonthlyRankingData {
  rank: number;
  store_id: string;
  store_name: string;
  monthly_sales: number;
  monthly_payments: number;
  unique_customers: number;
  average_payment: number;
}

export interface ProductRankingData {
  product_name: string;
  store_id: string;
  store_name: string;
  times_sold: number;
  total_quantity: number;
  total_revenue: number;
  average_price: number;
}

export class RankingService {
  // 店舗別総合ランキングを取得
  static async getStoreRanking(): Promise<StoreRankingData[]> {
    try {
      const { data, error } = await supabase.rpc('get_store_comprehensive_ranking');

      if (error) {
        console.error('店舗ランキング取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('店舗ランキング取得エラー:', error);
      return [];
    }
  }

  // 顧客別総合ランキングを取得
  static async getCustomerRanking(): Promise<CustomerRankingData[]> {
    try {
      const { data, error } = await supabase.rpc('get_customer_comprehensive_ranking');

      if (error) {
        console.error('顧客ランキング取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('顧客ランキング取得エラー:', error);
      return [];
    }
  }

  // 月次ランキングを取得
  static async getMonthlyRanking(year: number, month: number): Promise<MonthlyRankingData[]> {
    try {
      const { data, error } = await supabase.rpc('get_monthly_ranking', {
        year_param: year,
        month_param: month
      });

      if (error) {
        console.error('月次ランキング取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('月次ランキング取得エラー:', error);
      return [];
    }
  }

  // 商品別売上ランキングを取得
  static async getProductRanking(): Promise<ProductRankingData[]> {
    try {
      const { data, error } = await supabase
        .from('product_sales_ranking_view')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(50);

      if (error) {
        console.error('商品ランキング取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('商品ランキング取得エラー:', error);
      return [];
    }
  }

  // 決済方法別統計を取得
  static async getPaymentMethodStats(storeId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('payment_method_stats_view')
        .select('*')
        .order('total_amount', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('決済方法統計取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('決済方法統計取得エラー:', error);
      return [];
    }
  }

  // 店舗別詳細統計を取得
  static async getStoreDetailedStats(storeId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('payment_ranking_view')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error) {
        console.error('店舗詳細統計取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('店舗詳細統計取得エラー:', error);
      return null;
    }
  }

  // 顧客別詳細統計を取得
  static async getCustomerDetailedStats(customerId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('customer_payment_ranking_view')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error) {
        console.error('顧客詳細統計取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('顧客詳細統計取得エラー:', error);
      return null;
    }
  }

  // リアルタイムランキング更新（Supabase Realtime）
  static subscribeToRankingUpdates(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('payment_ranking_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_requests'
        },
        callback
      )
      .subscribe();

    return subscription;
  }

  // ランキングデータをフォーマット
  static formatRankingData(data: any[], type: 'store' | 'customer' | 'product'): any[] {
    return data.map((item, index) => ({
      ...item,
      rank: index + 1,
      formatted_sales: type === 'store' ? `¥${item.total_sales?.toLocaleString()}` : undefined,
      formatted_spent: type === 'customer' ? `¥${item.total_spent?.toLocaleString()}` : undefined,
      formatted_revenue: type === 'product' ? `¥${item.total_revenue?.toLocaleString()}` : undefined,
      formatted_average: `¥${item.average_payment?.toLocaleString()}`,
      formatted_date: item.last_payment_date ? new Date(item.last_payment_date).toLocaleDateString('ja-JP') : undefined
    }));
  }
}
