import { supabase } from '../lib/supabase';

export interface Florist {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export class FloristService {
  // 全フローリストを取得
  static async getAllFlorists(): Promise<Florist[]> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('フローリスト取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('フローリスト取得例外:', error);
      return [];
    }
  }

  // 地域でフローリストを検索
  static async searchFloristsByRegion(region: string): Promise<Florist[]> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .ilike('address', `%${region}%`)
        .order('name', { ascending: true });

      if (error) {
        console.error('地域検索エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('地域検索例外:', error);
      return [];
    }
  }

  // 店舗名でフローリストを検索
  static async searchFloristsByName(name: string): Promise<Florist[]> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .ilike('name', `%${name}%`)
        .order('name', { ascending: true });

      if (error) {
        console.error('店舗名検索エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('店舗名検索例外:', error);
      return [];
    }
  }

  // 特定のフローリストを取得
  static async getFloristById(id: string): Promise<Florist | null> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('フローリスト詳細取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('フローリスト詳細取得例外:', error);
      return null;
    }
  }
}
