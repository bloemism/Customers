// レッスン関連のAPI関数

import { supabase } from '../lib/supabase';
import type { 
  LessonSchedule, 
  LessonSchool, 
  CustomerParticipation, 
  LessonCompletion,
  ScheduleFormData,
  LessonPointsResponse
} from '../types/lesson';

// 定数
export const LESSON_POINTS_PER_SESSION = 10;
export const POINTS_PER_LEVEL = 100;

// レッスンスクール読み込み
export const loadLessonSchools = async (userEmail: string): Promise<LessonSchool[]> => {
  try {
    const { data, error } = await supabase
      .from('lesson_schools')
      .select('id, name, store_email')
      .eq('store_email', userEmail)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('レッスンスクール読み込みエラー:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('レッスンスクール読み込み例外:', error);
    throw error;
  }
};

// レッスンスケジュール読み込み
export const loadLessonSchedules = async (userEmail: string): Promise<LessonSchedule[]> => {
  try {
    // lesson_schoolsからid, nameを取得
    const { data: schoolsData, error: schoolsError } = await supabase
      .from('lesson_schools')
      .select('id, name')
      .eq('store_email', userEmail);

    if (schoolsError) {
      console.error('lesson_schools取得エラー:', schoolsError);
      throw schoolsError;
    }

    if (!schoolsData || schoolsData.length === 0) {
      return [];
    }

    // ユーザーが所有するスクールのIDリストを取得
    const schoolIds = schoolsData.map(school => school.id);

    // new_lesson_schedulesからユーザーのスクールのスケジュールのみ取得
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('new_lesson_schedules')
      .select('*')
      .in('lesson_school_id', schoolIds)
      .order('date', { ascending: true });

    if (schedulesError) {
      console.error('new_lesson_schedules取得エラー:', schedulesError);
      throw schedulesError;
    }

    if (!schedulesData || schedulesData.length === 0) {
      return [];
    }

    // スクール名をマッピング
    const schedulesWithSchoolNames = schedulesData.map(schedule => {
      const school = schoolsData.find(s => s.id === schedule.lesson_school_id);
      return {
        ...schedule,
        lesson_school_name: school?.name || '不明なスクール'
      };
    });

    return schedulesWithSchoolNames;
  } catch (error) {
    console.error('レッスンスケジュール読み込み例外:', error);
    throw error;
  }
};

// 顧客参加情報読み込み
export const loadCustomerParticipations = async (userEmail: string): Promise<CustomerParticipation[]> => {
  try {
    // まずユーザーが所有するスクールのIDを取得
    const { data: schoolsData, error: schoolsError } = await supabase
      .from('lesson_schools')
      .select('id')
      .eq('store_email', userEmail);

    if (schoolsError) {
      console.error('lesson_schools取得エラー:', schoolsError);
      throw schoolsError;
    }

    if (!schoolsData || schoolsData.length === 0) {
      return [];
    }

    const schoolIds = schoolsData.map(school => school.id);

    // ユーザーのスクールのスケジュールIDを取得
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('new_lesson_schedules')
      .select('id')
      .in('lesson_school_id', schoolIds);

    if (schedulesError) {
      console.error('new_lesson_schedules取得エラー:', schedulesError);
      throw schedulesError;
    }

    if (!schedulesData || schedulesData.length === 0) {
      return [];
    }

    const scheduleIds = schedulesData.map(schedule => schedule.id);

    // ユーザーのスクールのスケジュールに関連する参加情報のみ取得
    const { data, error } = await supabase
      .from('customer_participations')
      .select('*')
      .in('schedule_id', scheduleIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('顧客参加情報読み込みエラー:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('顧客参加情報読み込み例外:', error);
    throw error;
  }
};

// レッスン完了記録読み込み
export const loadLessonCompletions = async (userEmail: string): Promise<LessonCompletion[]> => {
  try {
    const { data, error } = await supabase
      .from('lesson_completions')
      .select('*')
      .eq('completed_by', userEmail)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('レッスン完了記録読み込みエラー:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('レッスン完了記録読み込み例外:', error);
    throw error;
  }
};

// スケジュール作成・更新
export const saveSchedule = async (
  formData: ScheduleFormData, 
  userEmail: string, 
  editingScheduleId?: string
): Promise<void> => {
  try {
    if (editingScheduleId) {
      // 更新
      const { error } = await supabase
        .from('new_lesson_schedules')
        .update({
          ...formData,
          store_email: userEmail
        })
        .eq('id', editingScheduleId);

      if (error) throw error;
    } else {
      // 新規作成
      const { error } = await supabase
        .from('new_lesson_schedules')
        .insert([{
          ...formData,
          store_email: userEmail
        }]);

      if (error) throw error;
    }
  } catch (error) {
    console.error('スケジュール保存エラー:', error);
    throw error;
  }
};

// スケジュール削除
export const deleteSchedule = async (scheduleId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('new_lesson_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
  } catch (error) {
    console.error('削除エラー:', error);
    throw error;
  }
};

// 顧客参加状況更新
export const updateCustomerParticipation = async (
  participationId: string, 
  newStatus: 'confirmed' | 'cancelled'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('customer_participations')
      .update({ status: newStatus })
      .eq('id', participationId);

    if (error) throw error;
  } catch (error) {
    console.error('参加状況更新エラー:', error);
    throw error;
  }
};

// レッスン終了処理（ポイント配布）
export const completeLesson = async (
  scheduleId: string, 
  userEmail: string
): Promise<LessonPointsResponse> => {
  try {
    const { data, error } = await supabase.rpc('distribute_lesson_points', {
      p_schedule_id: scheduleId,
      p_completed_by: userEmail
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('レッスン終了エラー:', error);
    throw error;
  }
};