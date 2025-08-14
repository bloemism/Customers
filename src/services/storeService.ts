import { supabase } from '../lib/supabase';

export interface Store {
  id: string;
  user_id: string;
  store_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  commerce_url: string | null;
  business_hours: string | null;
  holiday_info: string | null;
  parking_available: boolean;
  parking_info: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreDetails {
  id: string;
  user_id: string;
  store_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  commerce_url: string | null;
  business_hours: string | null;
  holiday_info: string | null;
  parking_available: boolean;
  parking_info: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  business_hours_details: any[];
  services: any[];
  photos: any[];
  recommended_flowers: any[];
  active_posts: any[];
}

export class StoreService {
  // 全店舗一覧取得（マップ表示用）
  static async getAllStores(): Promise<Store[]> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('store_name');

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('店舗一覧取得エラー:', error);
      throw new Error('店舗一覧の取得中にエラーが発生しました。');
    }
  }

  // 店舗詳細情報取得
  static async getStoreDetails(storeId: string): Promise<StoreDetails | null> {
    try {
      const { data, error } = await supabase
        .from('store_details')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('店舗詳細取得エラー:', error);
      throw new Error('店舗詳細の取得中にエラーが発生しました。');
    }
  }

  // ユーザーの店舗情報取得
  static async getUserStore(): Promise<Store | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('認証ユーザーが見つかりません。');
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      console.error('ユーザー店舗取得エラー:', error);
      throw new Error('店舗情報の取得中にエラーが発生しました。');
    }
  }

  // 新規店舗作成
  static async createStore(storeData: {
    store_name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    website_url?: string;
    instagram_url?: string;
    commerce_url?: string;
    business_hours?: string;
    holiday_info?: string;
    parking_available?: boolean;
    parking_info?: string;
    description?: string;
  }): Promise<Store> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('認証ユーザーが見つかりません。');
      }

      const { data, error } = await supabase
        .from('stores')
        .insert([{
          ...storeData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('店舗作成エラー:', error);
      throw new Error('店舗の作成中にエラーが発生しました。');
    }
  }

  // 店舗情報更新
  static async updateStore(storeId: string, updateData: Partial<Store>): Promise<Store> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', storeId)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('店舗更新エラー:', error);
      throw new Error('店舗情報の更新中にエラーが発生しました。');
    }
  }

  // 住所から緯度経度を取得（Geocoding）
  static async getCoordinatesFromAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const cityCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
        '東京': { latitude: 35.6762, longitude: 139.6503 },
        '大阪': { latitude: 34.6937, longitude: 135.5023 },
        '福岡': { latitude: 33.5902, longitude: 130.4017 },
        '名古屋': { latitude: 35.1815, longitude: 136.9066 },
        '札幌': { latitude: 43.0618, longitude: 141.3545 },
        '仙台': { latitude: 38.2688, longitude: 140.8721 },
        '広島': { latitude: 34.3853, longitude: 132.4553 },
        '京都': { latitude: 35.0116, longitude: 135.7681 },
        '神戸': { latitude: 34.6901, longitude: 135.1955 },
        '横浜': { latitude: 35.4437, longitude: 139.6380 }
      };

      for (const [city, coordinates] of Object.entries(cityCoordinates)) {
        if (address.includes(city)) {
          return coordinates;
        }
      }

      return null;
    } catch (error) {
      console.error('座標取得エラー:', error);
      return null;
    }
  }

  // サービスカテゴリ一覧
  static getServiceCategories(): Array<{ value: string; label: string }> {
    return [
      { value: 'bouquet', label: '花束' },
      { value: 'arrangement', label: 'アレンジメント' },
      { value: 'wedding', label: 'ブライダル' },
      { value: 'funeral', label: '葬儀・仏花' },
      { value: 'indoor', label: '観葉植物' },
      { value: 'pot', label: '鉢物' },
      { value: 'orchid', label: '胡蝶蘭' },
      { value: 'vase', label: 'ガラス花器' },
      { value: 'garden', label: 'ガーデン' },
      { value: 'gardening', label: '園芸資材' },
      { value: 'maintenance', label: '定期生け込み' },
      { value: 'lesson', label: 'フラワーレッスン' },
      { value: 'decoration', label: '装飾' },
      { value: 'stand', label: 'スタンド' }
    ];
  }

  // 投稿タイプ一覧
  static getPostTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'recruitment', label: 'バイト募集' },
      { value: 'lesson', label: 'レッスン生徒募集' },
      { value: 'announcement', label: 'お知らせ' },
      { value: 'event', label: 'イベント' },
      { value: 'sale', label: 'セール情報' },
      { value: 'other', label: 'その他' }
    ];
  }
}
