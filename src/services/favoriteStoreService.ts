import { supabase } from '../lib/supabase';

export interface CustomerFavorite {
  id: string;
  customer_id: string;
  store_id: string; // TEXT型として扱う
  status: 'favorite' | 'interested' | 'visited';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StoreWithFavoriteStatus {
  id: string; // TEXT型として扱う
  store_name: string;
  owner_name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  online_shop: string | null;
  description: string | null;
  business_hours: string | null;
  business_type: string | null;
  tags: string[] | null;
  has_parking: boolean;
  photos: string[] | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  bulletin_board: string | null;
  favorite_status?: 'favorite' | 'interested' | 'visited' | null;
  favorite_notes?: string;
}

export interface StoreFavoriteCount {
  total_favorites: number;
  favorite_count: number;
  interested_count: number;
  visited_count: number;
}

export class FavoriteStoreService {
  // 顧客が店舗をお気に入りに追加・更新
  static async addToFavorites(
    storeId: string, // TEXT型として扱う
    status: 'favorite' | 'interested' | 'visited', 
    notes?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証ユーザーが見つかりません');

      // Supabaseの関数を使用してお気に入りを追加
      const { error } = await supabase.rpc('add_customer_favorite', {
        p_store_id: storeId,
        p_status: status,
        p_notes: notes || null
      });

      if (error) throw error;
    } catch (error) {
      console.error('お気に入り追加エラー:', error);
      throw new Error('お気に入りの追加に失敗しました');
    }
  }

  // 顧客の店舗お気に入り状況を取得
  static async getStoreFavoriteStatus(storeId: string): Promise<CustomerFavorite | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証ユーザーが見つかりません');

      const { data, error } = await supabase
        .from('customer_favorites')
        .select('*')
        .eq('customer_id', user.id)
        .eq('store_id', storeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116はデータが見つからない場合
      
      return data;
    } catch (error) {
      console.error('お気に入り状況取得エラー:', error);
      return null;
    }
  }

  // お気に入りから削除
  static async removeFromFavorites(storeId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証ユーザーが見つかりません');

      const { error } = await supabase
        .from('customer_favorites')
        .delete()
        .eq('customer_id', user.id)
        .eq('store_id', storeId);

      if (error) throw error;
    } catch (error) {
      console.error('お気に入り削除エラー:', error);
      throw new Error('お気に入りの削除に失敗しました');
    }
  }

  // 顧客のお気に入り店舗一覧を取得
  static async getCustomerFavoriteStores(status?: 'favorite' | 'interested' | 'visited'): Promise<StoreWithFavoriteStatus[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証ユーザーが見つかりません');

      // Supabaseの関数を使用してお気に入り店舗を取得
      const { data, error } = await supabase.rpc('get_customer_favorite_stores', {
        p_status: status || null
      });

      if (error) throw error;

      // データを整形して返す
      return (data || []).map((store: any) => ({
        id: store.store_id,
        store_name: store.store_name,
        owner_name: '店舗オーナー', // 既存スキーマにはない
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        phone: null, // 既存スキーマにはない
        email: null, // 既存スキーマにはない
        website: null, // 既存スキーマにはない
        instagram: null, // 既存スキーマにはない
        online_shop: null, // 既存スキーマにはない
        description: null, // 既存スキーマにはない
        business_hours: null, // 既存スキーマにはない
        business_type: null, // 既存スキーマにはない
        tags: null, // 既存スキーマにはない
        has_parking: false, // 既存スキーマにはない
        photos: [], // 既存スキーマにはない
        is_verified: true, // 既存スキーマにはない
        is_active: true,
        created_at: store.created_at,
        updated_at: store.created_at, // 既存スキーマにはない
        bulletin_board: null, // 既存スキーマにはない
        favorite_status: store.status,
        favorite_notes: store.notes
      }));
    } catch (error) {
      console.error('お気に入り店舗取得エラー:', error);
      throw new Error('お気に入り店舗の取得に失敗しました');
    }
  }

  // 全店舗に顧客のお気に入り状況を付加して取得
  static async getAllStoresWithFavoriteStatus(): Promise<StoreWithFavoriteStatus[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証ユーザーが見つかりません');

      // まず、基本的な店舗情報を取得
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (storesError) throw storesError;

      // 次に、顧客のお気に入り情報を取得
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('customer_favorites')
        .select('*')
        .eq('customer_id', user.id);

      if (favoritesError) throw favoritesError;

      // お気に入り情報を店舗IDでマッピング
      const favoritesMap = new Map();
      (favoritesData || []).forEach(fav => {
        favoritesMap.set(fav.store_id, fav);
      });

      // データを整形して返す
      return (storesData || []).map(store => {
        const favorite = favoritesMap.get(store.id);
        return {
          id: store.id,
          store_name: store.name,
          owner_name: store.owner_id || '不明', // owner_idを使用
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          phone: store.phone,
          email: store.email,
          website: store.website,
          instagram: null, // 既存スキーマにはない
          online_shop: null, // 既存スキーマにはない
          description: store.description,
          business_hours: store.business_hours ? JSON.stringify(store.business_hours) : null,
          business_type: null, // 既存スキーマにはない
          tags: null, // 既存スキーマにはない
          has_parking: false, // 既存スキーマにはない
          photos: [], // 既存スキーマにはない
          is_verified: true, // 既存スキーマにはない
          is_active: store.is_active,
          created_at: store.created_at,
          updated_at: store.updated_at,
          bulletin_board: null, // 既存スキーマにはない
          favorite_status: favorite?.status || null,
          favorite_notes: favorite?.notes || null
        };
      });
    } catch (error) {
      console.error('店舗一覧取得エラー:', error);
      throw new Error('店舗一覧の取得に失敗しました');
    }
  }

  // お気に入り状況を更新
  static async updateFavoriteStatus(
    storeId: string, // TEXT型として扱う
    status: 'favorite' | 'interested' | 'visited', 
    notes?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証ユーザーが見つかりません');

      const { error } = await supabase
        .from('customer_favorites')
        .update({
          status,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', user.id)
        .eq('store_id', storeId);

      if (error) throw error;
    } catch (error) {
      console.error('お気に入り状況更新エラー:', error);
      throw new Error('お気に入り状況の更新に失敗しました');
    }
  }

  // 店舗のお気に入り登録数を取得（店舗オーナー用）
  static async getStoreFavoriteCount(storeId: string): Promise<StoreFavoriteCount | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証ユーザーが見つかりません');

      // Supabaseの関数を使用してお気に入り数を取得
      const { data, error } = await supabase.rpc('get_store_favorite_count', {
        p_store_id: storeId
      });

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      console.error('お気に入り数取得エラー:', error);
      return null;
    }
  }
}
