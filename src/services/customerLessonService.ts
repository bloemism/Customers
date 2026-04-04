// 顧客向けレッスン関連のAPI関数

import { supabase } from '../lib/supabase';
import type { LessonSchedule, LessonSchool } from '../types/lesson';

// 顧客が登録しているスクールID一覧を取得
export const getCustomerRegisteredSchools = async (customerId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('customer_school_registrations')
      .select('lesson_school_id')
      .eq('customer_id', customerId)
      .eq('is_active', true);

    if (error) {
      console.error('登録スクール取得エラー:', error);
      throw error;
    }

    return data?.map(item => item.lesson_school_id) || [];
  } catch (error) {
    console.error('登録スクール取得例外:', error);
    throw error;
  }
};

// 顧客が登録しているスクールの詳細情報を取得
export const getCustomerRegisteredSchoolsWithDetails = async (customerId: string): Promise<LessonSchool[]> => {
  try {
    const { data, error } = await supabase
      .from('customer_school_registrations')
      .select(`
        lesson_school_id,
        lesson_schools!inner (
          id,
          name,
          store_email
        )
      `)
      .eq('customer_id', customerId)
      .eq('is_active', true);

    if (error) {
      console.error('登録スクール詳細取得エラー:', error);
      throw error;
    }

    return data?.map(item => ({
      id: item.lesson_schools.id,
      name: item.lesson_schools.name,
      store_email: item.lesson_schools.store_email
    })) || [];
  } catch (error) {
    console.error('登録スクール詳細取得例外:', error);
    throw error;
  }
};

// 顧客が登録しているスクールのスケジュールを統合取得
export const getCustomerLessonSchedules = async (customerId: string): Promise<LessonSchedule[]> => {
  try {
    // まず顧客が登録しているスクールIDを取得
    const schoolIds = await getCustomerRegisteredSchools(customerId);

    if (schoolIds.length === 0) {
      return [];
    }

    // 登録しているスクールのスケジュールを取得（過去・未来とも反映）
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('new_lesson_schedules')
      .select('*')
      .in('lesson_school_id', schoolIds)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (schedulesError) {
      console.error('スケジュール取得エラー:', schedulesError);
      throw schedulesError;
    }

    if (!schedulesData || schedulesData.length === 0) {
      return [];
    }

    // スクール名を取得してマッピング
    const { data: schoolsData, error: schoolsError } = await supabase
      .from('lesson_schools')
      .select('id, name')
      .in('id', schoolIds);

    if (schoolsError) {
      console.error('スクール名取得エラー:', schoolsError);
      throw schoolsError;
    }

    const schedulesWithSchoolNames = schedulesData.map(schedule => {
      const school = schoolsData?.find(s => s.id === schedule.lesson_school_id);
      return {
        ...schedule,
        lesson_school_name: school?.name || '不明なスクール'
      };
    });

    return schedulesWithSchoolNames;
  } catch (error) {
    console.error('顧客スケジュール取得例外:', error);
    throw error;
  }
};

// 顧客をスクールに登録
export const registerCustomerToSchool = async (
  customerId: string,
  lessonSchoolId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 既に登録されているかチェック
    const { data: existing, error: checkError } = await supabase
      .from('customer_school_registrations')
      .select('id')
      .eq('customer_id', customerId)
      .eq('lesson_school_id', lessonSchoolId)
      .eq('is_active', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116は「行が見つからない」エラーなので、これは正常
      console.error('登録チェックエラー:', checkError);
      throw checkError;
    }

    if (existing) {
      return { success: false, error: '既に登録されています' };
    }

    // 登録
    const { error: insertError } = await supabase
      .from('customer_school_registrations')
      .insert({
        customer_id: customerId,
        lesson_school_id: lessonSchoolId,
        is_active: true
      });

    if (insertError) {
      console.error('スクール登録エラー:', insertError);
      throw insertError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('スクール登録例外:', error);
    return { 
      success: false, 
      error: error.message || 'スクール登録に失敗しました' 
    };
  }
};

// 顧客が参加登録済みのスケジュールID一覧を取得
export const getCustomerParticipationScheduleIds = async (customerId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('customer_participations')
      .select('schedule_id')
      .eq('customer_id', customerId)
      .eq('status', 'confirmed');

    if (error) {
      console.error('参加済み取得エラー:', error);
      return [];
    }
    return data?.map(row => row.schedule_id) || [];
  } catch (e) {
    console.error('参加済み取得例外:', e);
    return [];
  }
};

type ParticipationRpcResult = {
  success?: boolean;
  error?: string;
  action?: string;
};

function parseParticipationRpc(data: unknown): ParticipationRpcResult {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as ParticipationRpcResult;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as ParticipationRpcResult;
  }
  return {};
}

// レッスンスケジュールに参加申込（DB側 RPC で participations / notifications / lesson_points を一括更新）
export const participateInSchedule = async (
  scheduleId: string,
  _customerId: string,
  _customerName: string,
  _customerEmail: string,
  _customerPhone?: string,
  _scheduleTitle?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user?.id) {
      return { success: false, error: 'ログインが必要です' };
    }

    const { data, error } = await supabase.rpc('customer_lesson_participation_action', {
      p_schedule_id: scheduleId,
      p_action: 'join'
    });

    if (error) {
      console.error('レッスン参加RPC:', error);
      return { success: false, error: error.message || '参加登録に失敗しました' };
    }

    const parsed = parseParticipationRpc(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error || '参加登録に失敗しました' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('レッスン参加登録例外:', error);
    return {
      success: false,
      error: error.message || '参加登録に失敗しました'
    };
  }
};

// レッスン参加を取り消す（RPC: participations を cancelled / notifications / lesson_points を一括）
export const cancelParticipationInSchedule = async (
  scheduleId: string,
  _customerId: string,
  _scheduleTitle?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user?.id) {
      return { success: false, error: 'ログインが必要です' };
    }

    const { data, error } = await supabase.rpc('customer_lesson_participation_action', {
      p_schedule_id: scheduleId,
      p_action: 'cancel'
    });

    if (error) {
      console.error('レッスン取り消しRPC:', error);
      return { success: false, error: error.message || '取り消しに失敗しました' };
    }

    const parsed = parseParticipationRpc(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error || '取り消しに失敗しました' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('参加取り消し例外:', error);
    return {
      success: false,
      error: error?.message || '取り消しに失敗しました'
    };
  }
};

// レッスンXP（ポイント合計・レベル）を取得（バー表示用）
export const getCustomerLessonPointTotals = async (customerId: string): Promise<{ total_points: number; current_level: number }> => {
  try {
    const { data, error } = await supabase
      .from('customer_point_totals')
      .select('total_points, current_level')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (error || !data) {
      return { total_points: 0, current_level: 1 };
    }
    return {
      total_points: Number(data.total_points ?? 0),
      current_level: Number(data.current_level ?? 1)
    };
  } catch {
    return { total_points: 0, current_level: 1 };
  }
};

// 顧客のスクール登録を解除
export const unregisterCustomerFromSchool = async (
  customerId: string,
  lessonSchoolId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('customer_school_registrations')
      .update({ is_active: false })
      .eq('customer_id', customerId)
      .eq('lesson_school_id', lessonSchoolId);

    if (error) {
      console.error('スクール登録解除エラー:', error);
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('スクール登録解除例外:', error);
    return { 
      success: false, 
      error: error.message || 'スクール登録解除に失敗しました' 
    };
  }
};

