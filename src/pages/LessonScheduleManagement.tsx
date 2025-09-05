import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Star,
  Heart
} from 'lucide-react';
import LessonCalendar from '../components/LessonCalendar';

// レッスンスケジュールの型定義
interface LessonSchedule {
  id: string;
  lesson_school_id: string;
  lesson_school_name: string;
  store_name: string;
  store_address: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

// レッスンブッキングの型定義
interface LessonBooking {
  id: string;
  lesson_schedule_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  created_at: string;
}

// スクール登録の型定義
interface SchoolRegistration {
  id: string;
  lesson_school_id: string;
  lesson_school_name: string;
  store_name: string;
  registered_at: string;
  is_active: boolean;
}

const LessonScheduleManagement: React.FC = () => {
  const { customer, getRegisteredSchools } = useCustomerAuth();
  
  // レッスンスケジュール一覧
  const [lessonSchedules, setLessonSchedules] = useState<LessonSchedule[]>([]);
  
  // レッスンブッキング一覧
  const [lessonBookings, setLessonBookings] = useState<LessonBooking[]>([]);
  
  // 登録済みスクール一覧
  const [registeredSchools, setRegisteredSchools] = useState<SchoolRegistration[]>([]);
  
  // 選択されたスケジュール
  const [selectedSchedule, setSelectedSchedule] = useState<LessonSchedule | null>(null);
  
  // 選択された日付
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // ローディング状態
  const [loading, setLoading] = useState(true);
  
  // 成功・エラーメッセージ
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 登録済みスクールを読み込み
  useEffect(() => {
    const loadRegisteredSchools = async () => {
      if (!customer?.id) return;
      
      try {
        const schools = await getRegisteredSchools();
        setRegisteredSchools(schools);
      } catch (error) {
        console.error('登録スクール読み込みエラー:', error);
      }
    };

    loadRegisteredSchools();
  }, [customer, getRegisteredSchools]);

  // レッスンスケジュールを読み込み（登録済みスクールのスケジュールのみ）
  useEffect(() => {
    const loadLessonSchedules = async () => {
      if (registeredSchools.length === 0) {
        setLessonSchedules([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const schoolIds = registeredSchools.map(school => school.lesson_school_id);
        
        const { data, error } = await supabase
          .from('lesson_schedule')
          .select(`
            *,
            lesson_schools!inner(name, store_name, store_address)
          `)
          .in('lesson_school_id', schoolIds)
          .eq('is_active', true)
          .gte('date', new Date().toISOString().split('T')[0]) // 今日以降のスケジュールのみ
          .order('date', { ascending: true });

        if (error) {
          console.error('レッスンスケジュール読み込みエラー:', error);
        } else if (data) {
          const schedules = data.map(item => ({
            ...item,
            lesson_school_name: item.lesson_schools?.name || '不明',
            store_name: item.lesson_schools?.store_name || '不明',
            store_address: item.lesson_schools?.store_address || '不明'
          }));
          setLessonSchedules(schedules);
        }
      } catch (error) {
        console.error('レッスンスケジュール読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLessonSchedules();
  }, [registeredSchools]);

  // レッスンブッキングを読み込み
  useEffect(() => {
    const loadLessonBookings = async () => {
      if (!customer?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('lesson_bookings')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('レッスンブッキング読み込みエラー:', error);
        } else if (data) {
          setLessonBookings(data);
        }
      } catch (error) {
        console.error('レッスンブッキング読み込みエラー:', error);
      }
    };

    loadLessonBookings();
  }, [customer]);

  // ランダムな色を生成
  const getRandomColor = (id: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-red-500', 'bg-yellow-500'
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // カレンダー用のスケジュールデータを準備
  const calendarSchedules = lessonSchedules.map(schedule => ({
    ...schedule,
    color: getRandomColor(schedule.id) // ランダムな色を割り当て
  }));

  // 日付がクリックされた時の処理
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  };

  // スケジュールがクリックされた時の処理
  const handleScheduleClick = (schedule: any) => {
    setSelectedSchedule(schedule);
    setSelectedDate(schedule.date);
  };

  // 参加表明
  const handleParticipation = async (scheduleId: string) => {
    if (!customer?.id) {
      setMessage({ type: 'error', text: 'ログインが必要です' });
      return;
    }

    try {
      const { error } = await supabase
        .from('lesson_bookings')
        .insert({
          lesson_schedule_id: scheduleId,
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: '参加表明を送信しました' });
      
      // レッスンブッキング一覧を再読み込み
      const { data } = await supabase
        .from('lesson_bookings')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (data) {
        setLessonBookings(data);
      }
    } catch (error) {
      console.error('参加表明エラー:', error);
      setMessage({ type: 'error', text: '参加表明に失敗しました' });
    }
  };

  // 参加キャンセル
  const handleCancelParticipation = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: '参加をキャンセルしました' });
      
      // レッスンブッキング一覧を再読み込み
      const { data } = await supabase
        .from('lesson_bookings')
        .select('*')
        .eq('customer_id', customer?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setLessonBookings(data);
      }
    } catch (error) {
      console.error('キャンセルエラー:', error);
      setMessage({ type: 'error', text: 'キャンセルに失敗しました' });
    }
  };

  // 既に参加表明しているかチェック
  const isParticipating = (scheduleId: string) => {
    return lessonBookings.some(b => b.lesson_schedule_id === scheduleId && b.status !== 'cancelled');
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">レッスンスケジュール情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-white hover:text-cyan-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">レッスンスケジュール</h1>
              <p className="text-cyan-100">フラワーレッスンのスケジュールを確認・参加表明</p>
            </div>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}


        {/* 登録済みスクール情報 */}
        {registeredSchools.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">登録済みスクール</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {registeredSchools.map((school) => (
                <div key={school.id} className="bg-white rounded-lg p-3 border border-cyan-200">
                  <h4 className="font-medium text-gray-900">{school.lesson_school_name}</h4>
                  <p className="text-sm text-gray-600">{school.store_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    登録日: {new Date(school.registered_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* カレンダー表示 */}
        <div className="mb-8">
          <LessonCalendar
            schedules={calendarSchedules}
            onDateClick={handleDateClick}
            onScheduleClick={handleScheduleClick}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：レッスンスケジュール一覧 */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              レッスンスケジュール一覧
              {selectedDate && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selectedDate})
                </span>
              )}
            </h2>
            
            {registeredSchools.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>スクールに登録されていません</p>
                <p className="text-sm mt-2">店舗でQRコードをスキャンしてスクールに登録してください</p>
              </div>
            ) : lessonSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>開催予定のレッスンがありません</p>
                <p className="text-sm mt-2">新しいレッスンが追加されるまでお待ちください</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessonSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedSchedule?.id === schedule.id
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedSchedule(schedule)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {schedule.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {schedule.lesson_school_name} - {schedule.store_name}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(schedule.date + 'T00:00:00+09:00').toLocaleDateString('ja-JP')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{schedule.start_time} - {schedule.end_time}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          {schedule.description.length > 100
                            ? `${schedule.description.substring(0, 100)}...`
                            : schedule.description
                          }
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <span className="text-cyan-600 font-medium">
                            料金: ¥{schedule.price.toLocaleString()}
                          </span>
                          <span className="text-teal-600 font-medium">
                            参加者: {schedule.current_participants}/{schedule.max_participants}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{schedule.store_address}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {isParticipating(schedule.id) ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-600 font-medium">参加表明済み</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleParticipation(schedule.id);
                            }}
                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm flex items-center"
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            参加表明
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右側：参加表明一覧 */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              参加表明一覧
            </h2>
            
            {lessonBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>参加表明したレッスンがありません</p>
                <p className="text-sm mt-2">左側のレッスンから参加表明してください</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessonBookings.map((booking) => {
                  const schedule = lessonSchedules.find(s => s.id === booking.lesson_schedule_id);
                  return (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {schedule?.title || 'レッスン情報なし'}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{schedule ? new Date(schedule.date + 'T00:00:00+09:00').toLocaleDateString('ja-JP') : '日付不明'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{schedule?.start_time} - {schedule?.end_time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{schedule?.store_name}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {booking.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                              {booking.status === 'confirmed' ? '参加確定' : 
                               booking.status === 'pending' ? '参加待ち' : 'キャンセル'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelParticipation(booking.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                            >
                              キャンセル
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonScheduleManagement;
