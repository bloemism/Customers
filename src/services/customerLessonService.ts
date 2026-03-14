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

// レッスンスケジュールに参加申込（顧客が「参加する」で登録）
export const participateInSchedule = async (
  scheduleId: string,
  customerId: string,
  customerName: string,
  customerEmail: string,
  customerPhone?: string,
  scheduleTitle?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: existing } = await supabase
      .from('customer_participations')
      .select('id')
      .eq('schedule_id', scheduleId)
      .eq('customer_id', customerId)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (existing) {
      return { success: false, error: '既にこのレッスンに参加登録済みです' };
    }

    const { error } = await supabase
      .from('customer_participations')
      .insert({
        schedule_id: scheduleId,
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        status: 'confirmed'
      });

    if (error) {
      console.error('レッスン参加登録エラー:', error);
      throw error;
    }

    const notifRow: Record<string, unknown> = {
      customer_id: customerId,
      notification_type: 'lesson_participation',
      is_enabled: true
    };
    if (typeof scheduleTitle === 'string') {
      notifRow.title = 'レッスン参加申し込み';
      notifRow.message = `「${scheduleTitle}」に参加を申し込みました。`;
      notifRow.related_schedule_id = scheduleId;
    }
    const { error: notifErr } = await supabase.from('customer_notifications').insert(notifRow);
    if (notifErr) console.warn('customer_notifications 参加連携:', notifErr.message);

    const { error: rpcError } = await supabase.rpc('add_lesson_points_on_participation', {
      p_schedule_id: scheduleId,
      p_customer_id: customerId,
      p_customer_name: customerName,
      p_customer_email: customerEmail
    });
    if (rpcError) {
      console.warn('レッスンポイント付与RPC:', rpcError.message);
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

// レッスン参加を取り消す（参加済み→取り消し。レッスン日を過ぎる前のみ可能）
export const cancelParticipationInSchedule = async (
  scheduleId: string,
  customerId: string,
  scheduleTitle?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: participation, error: findErr } = await supabase
      .from('customer_participations')
      .select('id')
      .eq('schedule_id', scheduleId)
      .eq('customer_id', customerId)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (findErr || !participation) {
      return { success: false, error: '参加記録が見つかりません' };
    }

    const { error: updateErr } = await supabase
      .from('customer_participations')
      .update({ status: 'cancelled' })
      .eq('id', participation.id);

    if (updateErr) {
      console.error('参加取り消しエラー:', updateErr);
      return { success: false, error: updateErr.message || '取り消しに失敗しました' };
    }

    const notifRow: Record<string, unknown> = {
      customer_id: customerId,
      notification_type: 'lesson_cancellation',
      is_enabled: true
    };
    if (typeof scheduleTitle === 'string') {
      notifRow.title = 'レッスン参加取り消し';
      notifRow.message = `「${scheduleTitle}」の参加を取り消しました。`;
      notifRow.related_schedule_id = scheduleId;
    }
    const { error: notifErr } = await supabase.from('customer_notifications').insert(notifRow);
    if (notifErr) console.warn('customer_notifications 取り消し連携:', notifErr.message);

    const { error: rpcError } = await supabase.rpc('remove_lesson_points_on_cancel', {
      p_schedule_id: scheduleId,
      p_customer_id: customerId
    });
    if (rpcError) {
      console.warn('レッスンポイント減算RPC:', rpcError.message);
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

