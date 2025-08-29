import { supabase } from '../lib/supabase';

export interface FlowerLesson {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonBooking {
  id: string;
  user_id: string;
  lesson_id: string;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export class LessonService {
  // 全フラワーレッスンを取得
  static async getAllLessons(): Promise<FlowerLesson[]> {
    try {
      const { data, error } = await supabase
        .from('lesson_schools')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('フラワーレッスン取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('フラワーレッスン取得例外:', error);
      return [];
    }
  }

  // 地域でフラワーレッスンを検索
  static async searchLessonsByRegion(region: string): Promise<FlowerLesson[]> {
    try {
      const { data, error } = await supabase
        .from('lesson_schools')
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

  // スクール名でフラワーレッスンを検索
  static async searchLessonsByName(name: string): Promise<FlowerLesson[]> {
    try {
      const { data, error } = await supabase
        .from('lesson_schools')
        .select('*')
        .ilike('name', `%${name}%`)
        .order('name', { ascending: true });

      if (error) {
        console.error('スクール名検索エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('スクール名検索例外:', error);
      return [];
    }
  }

  // 特定のフラワーレッスンを取得
  static async getLessonById(id: string): Promise<FlowerLesson | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_schools')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('フラワーレッスン詳細取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('フラワーレッスン詳細取得例外:', error);
      return null;
    }
  }

  // ユーザーのレッスン予約を取得
  static async getUserBookings(userId: string): Promise<LessonBooking[]> {
    try {
      const { data, error } = await supabase
        .from('lesson_bookings')
        .select(`
          *,
          lesson_schools (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('レッスン予約取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('レッスン予約取得例外:', error);
      return [];
    }
  }

  // レッスン予約を作成
  static async createBooking(bookingData: {
    user_id: string;
    lesson_id: string;
    scheduled_date: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lesson_bookings')
        .insert([{
          ...bookingData,
          status: 'scheduled',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('レッスン予約作成エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('レッスン予約作成例外:', error);
      return false;
    }
  }

  // レッスン予約を更新
  static async updateBooking(bookingId: string, status: 'scheduled' | 'completed' | 'cancelled'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lesson_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) {
        console.error('レッスン予約更新エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('レッスン予約更新例外:', error);
      return false;
    }
  }
}
