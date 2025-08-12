import { supabase } from '../lib/supabase';
import type { Store, StoreSearchParams, ApiResponse } from '../types';

export class StoreService {
  // 現在地周辺の店舗を検索
  static async searchNearbyStores(params: StoreSearchParams): Promise<ApiResponse<Store[]>> {
    try {
      const { latitude, longitude, radius = 10, category, keyword } = params;
      
      let query = supabase
        .from('stores')
        .select(`
          *,
          images (*)
        `)
        .eq('is_active', true);

      // カテゴリフィルター
      if (category) {
        query = query.eq('category', category);
      }

      // キーワード検索
      if (keyword) {
        query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching stores:', error);
        return { data: null, error: error.message, success: false };
      }

      // 距離でフィルタリング
      const filteredStores = data?.filter(store => {
        const distance = this.calculateDistance(
          latitude, longitude,
          store.latitude, store.longitude
        );
        return distance <= radius;
      }) || [];

      return { data: filteredStores, error: null, success: true };
    } catch (error) {
      console.error('Error in searchNearbyStores:', error);
      return { data: null, error: '店舗の検索に失敗しました', success: false };
    }
  }

  // 店舗詳細を取得
  static async getStoreById(storeId: string): Promise<ApiResponse<Store>> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          images (*)
        `)
        .eq('id', storeId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching store:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in getStoreById:', error);
      return { data: null, error: '店舗情報の取得に失敗しました', success: false };
    }
  }

  // 2点間の距離を計算（km）
  private static calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371; // 地球の半径（km）
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
