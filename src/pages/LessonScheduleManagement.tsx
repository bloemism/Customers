import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  QrCode,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import LessonCalendar from '../components/LessonCalendar';

// レッスンスケジュールの型定義
interface LessonSchedule {
  id: string;
  lesson_school_id: string;
  lesson_school_name: string;
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

// 生徒の予約情報の型定義
interface StudentReservation {
  id: string;
  schedule_id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  qr_code_data: string;
  created_at: string;
}

// 新規作成用の型定義
interface NewLessonSchedule {
  lesson_school_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  price: number;
}

const LessonScheduleManagement: React.FC = () => {
  const { user } = useSimpleAuth();
  
  // レッスンスクール一覧
  const [lessonSchools, setLessonSchools] = useState<{ id: string; name: string }[]>([]);
  
  // レッスンスケジュール一覧
  const [lessonSchedules, setLessonSchedules] = useState<LessonSchedule[]>([]);
  
  // 生徒の予約一覧
  const [studentReservations, setStudentReservations] = useState<StudentReservation[]>([]);
  
  // 新規作成・編集モード
  const [isEditing, setIsEditing] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<LessonSchedule | null>(null);
  
  // 新規作成フォーム
  const [newSchedule, setNewSchedule] = useState<NewLessonSchedule>({
    lesson_school_id: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    max_participants: 1,
    price: 0
  });
  
  // 選択されたスケジュール
  const [selectedSchedule, setSelectedSchedule] = useState<LessonSchedule | null>(null);
  
  // 選択された日付
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // ローディング状態
  const [loading, setLoading] = useState(true);
  
  // 成功・エラーメッセージ
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // レッスンスクールを読み込み
  useEffect(() => {
    const loadLessonSchools = async () => {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('lesson_schools')
          .select('id, name')
          .eq('store_email', user.email)
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('レッスンスクール読み込みエラー:', error);
        } else if (data) {
          setLessonSchools(data);
        }
      } catch (error) {
        console.error('レッスンスクール読み込みエラー:', error);
      }
    };

    loadLessonSchools();
  }, [user]);

  // レッスンスケジュールを読み込み
  useEffect(() => {
    const loadLessonSchedules = async () => {
      if (!user?.email) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('lesson_schedules')
          .select(`
            *,
            lesson_schools!inner(name)
          `)
          .eq('lesson_schools.store_email', user.email)
          .order('date', { ascending: true });

        if (error) {
          console.error('レッスンスケジュール読み込みエラー:', error);
        } else if (data) {
          const schedules = data.map(item => ({
            ...item,
            lesson_school_name: item.lesson_schools?.name || '不明'
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
  }, [user]);

  // 生徒の予約を読み込み
  useEffect(() => {
    const loadStudentReservations = async () => {
      if (!selectedSchedule) return;
      
      try {
        const { data, error } = await supabase
          .from('student_reservations')
          .select('*')
          .eq('schedule_id', selectedSchedule.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('生徒予約読み込みエラー:', error);
        } else if (data) {
          setStudentReservations(data);
        }
      } catch (error) {
        console.error('生徒予約読み込みエラー:', error);
      }
    };

    loadStudentReservations();
  }, [selectedSchedule]);

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

  // 新規作成モードを開始
  const startCreate = () => {
    setIsEditing(true);
    setEditingSchedule(null);
    setNewSchedule({
      lesson_school_id: lessonSchools.length > 0 ? lessonSchools[0].id : '',
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      max_participants: 1,
      price: 0
    });
  };

  // 編集モードを開始
  const startEdit = (schedule: LessonSchedule) => {
    console.log('編集開始:', schedule);
    setIsEditing(true);
    setEditingSchedule(schedule);
    setNewSchedule({
      lesson_school_id: schedule.lesson_school_id,
      title: schedule.title,
      description: schedule.description,
      date: schedule.date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      max_participants: schedule.max_participants,
      price: schedule.price
    });
    console.log('編集状態:', { isEditing: true, editingSchedule: schedule, newSchedule: newSchedule });
  };

  // 編集・作成をキャンセル
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingSchedule(null);
    setNewSchedule({
      lesson_school_id: lessonSchools.length > 0 ? lessonSchools[0].id : '',
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      max_participants: 1,
      price: 0
    });
  };

  // 保存処理
  const handleSave = async () => {
    if (!user?.email) {
      setMessage({ type: 'error', text: 'ユーザー情報が取得できません' });
      return;
    }

    // バリデーション
    if (!newSchedule.lesson_school_id || !newSchedule.title || !newSchedule.date) {
      setMessage({ type: 'error', text: '必須項目を入力してください' });
      return;
    }

    try {
      if (editingSchedule) {
        // 更新処理
        console.log('更新処理開始:', { editingScheduleId: editingSchedule.id, newSchedule });
        
        const { data, error } = await supabase
          .from('lesson_schedules')
          .update(newSchedule)
          .eq('id', editingSchedule.id)
          .select();

        if (error) {
          console.error('Supabase更新エラー:', error);
          throw error;
        }

        console.log('更新成功:', data);
        setMessage({ type: 'success', text: 'レッスンスケジュールを更新しました' });
        
        // 更新後に最新データを再取得
        try {
          const { data: refreshedData, error: refreshError } = await supabase
            .from('lesson_schedules')
            .select(`
              *,
              lesson_schools!inner(name)
            `)
            .eq('lesson_schools.store_email', user.email)
            .order('date', { ascending: true });

          if (refreshError) {
            console.error('更新後の再取得エラー:', refreshError);
          } else if (refreshedData) {
            const schedules = refreshedData.map(item => ({
              ...item,
              lesson_school_name: item.lesson_schools?.name || '不明'
            }));
            setLessonSchedules(schedules);
            console.log('更新後の再取得完了:', schedules);
          }
        } catch (refreshError) {
          console.error('更新後の再取得エラー:', refreshError);
        }
      } else {
        // 新規作成処理
        const { error } = await supabase
          .from('lesson_schedules')
          .insert({
            ...newSchedule,
            is_active: true,
            current_participants: 0,
            created_at: new Date().toISOString()
          });

        if (error) {
          throw error;
        }

        setMessage({ type: 'success', text: 'レッスンスケジュールを作成しました' });
      }

      // 保存成功後の即座の状態更新
      if (editingSchedule) {
        // 更新の場合：既存のスケジュールを更新
        console.log('ローカル状態更新開始:', { editingScheduleId: editingSchedule.id });
        
        setLessonSchedules(prev => {
          const updated = prev.map(schedule => 
            schedule.id === editingSchedule.id 
              ? {
                  ...schedule,
                  ...newSchedule,
                  lesson_school_name: lessonSchools.find(s => s.id === newSchedule.lesson_school_id)?.name || '不明'
                }
              : schedule
          );
          console.log('更新後のスケジュール一覧:', updated);
          return updated;
        });
      } else {
        // 新規作成の場合：新しいスケジュールを追加
        const newScheduleWithId = {
          id: Date.now().toString(), // 一時的なID
          ...newSchedule,
          lesson_school_name: lessonSchools.find(s => s.id === newSchedule.lesson_school_id)?.name || '不明',
          current_participants: 0,
          is_active: true,
          created_at: new Date().toISOString()
        };
        setLessonSchedules(prev => [...prev, newScheduleWithId]);
      }

      // 編集モードを終了
      cancelEdit();
    } catch (error) {
      console.error('保存エラー:', error);
      setMessage({ type: 'error', text: '保存に失敗しました' });
    }
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    if (!confirm('このレッスンスケジュールを削除しますか？')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lesson_schedules')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'レッスンスケジュールを削除しました' });
      
      // 一覧から削除
      setLessonSchedules(prev => prev.filter(schedule => schedule.id !== id));
    } catch (error) {
      console.error('削除エラー:', error);
      setMessage({ type: 'error', text: '削除に失敗しました' });
    }
  };

  // 生徒の予約ステータスを更新
  const updateReservationStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('student_reservations')
        .update({ status })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: '予約ステータスを更新しました' });
      
      // 一覧を更新
      setStudentReservations(prev => 
        prev.map(reservation => 
          reservation.id === id 
            ? { ...reservation, status }
            : reservation
        )
      );
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      setMessage({ type: 'error', text: 'ステータス更新に失敗しました' });
    }
  };

  // QRコードによる顧客データ取得（シミュレーション）
  const simulateQRCodeScan = () => {
    const mockStudent: StudentReservation = {
      id: Date.now().toString(),
      schedule_id: selectedSchedule!.id,
      student_name: '田中花子',
      student_email: 'tanaka@example.com',
      student_phone: '090-1234-5678',
      status: 'pending',
      qr_code_data: 'mock-qr-data',
      created_at: new Date().toISOString()
    };

    setStudentReservations(prev => [mockStudent, ...prev]);
    setMessage({ type: 'success', text: 'QRコードから顧客データを取得しました' });
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">レッスンスケジュール管理</h1>
              <p className="text-gray-600">フラワーレッスンのスケジュールと生徒予約を管理</p>
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={startCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              新規スケジュール作成
            </button>
          )}
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

        {/* 編集・作成フォーム */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="text-sm text-gray-500 mb-2">
              デバッグ: isEditing={isEditing.toString()}, editingSchedule={editingSchedule ? 'あり' : 'なし'}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSchedule ? 'レッスンスケジュール編集' : '新規レッスンスケジュール作成'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    レッスンスクール <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newSchedule.lesson_school_id}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, lesson_school_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">スクールを選択</option>
                    {lessonSchools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    レッスンタイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="レッスンタイトルを入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    レッスン説明
                  </label>
                  <textarea
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="レッスンの詳細説明を入力"
                  />
                </div>
              </div>

              {/* スケジュール情報 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開催日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    // 日本時間での日付入力を保証
                  />
                  <p className="text-xs text-gray-500 mt-1">日本時間（JST）で入力してください</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      開始時間
                    </label>
                    <input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      終了時間
                    </label>
                    <input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大参加者数
                    </label>
                    <input
                      type="number"
                      value={newSchedule.max_participants}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      料金
                    </label>
                    <input
                      type="text"
                      value={newSchedule.price || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setNewSchedule(prev => ({ ...prev, price: value ? parseInt(value) : 0 }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="料金を入力（数字のみ）"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingSchedule ? '更新' : '作成'}
              </button>
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              レッスンスケジュール一覧
              {selectedDate && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selectedDate})
                </span>
              )}
            </h2>
            
            {lessonSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>登録されたレッスンスケジュールがありません</p>
                <p className="text-sm mt-2">新規作成ボタンから追加してください</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessonSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedSchedule?.id === schedule.id
                        ? 'border-blue-500 bg-blue-50'
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
                          {schedule.lesson_school_name}
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
                          <span className="text-blue-600 font-medium">
                            料金: ¥{schedule.price.toLocaleString()}
                          </span>
                          <span className="text-green-600 font-medium">
                            参加者: {schedule.current_participants}/{schedule.max_participants}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(schedule);
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          編集
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(schedule.id);
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右側：生徒予約一覧 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              生徒予約一覧
              {selectedSchedule && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selectedSchedule.title})
                </span>
              )}
            </h2>
            
            {!selectedSchedule ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>左側のスケジュールを選択してください</p>
                <p className="text-sm mt-2">生徒の予約状況が表示されます</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    選択中: {selectedSchedule.title}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {new Date(selectedSchedule.date + 'T00:00:00+09:00').toLocaleDateString('ja-JP')} {selectedSchedule.start_time} - {selectedSchedule.end_time}
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={simulateQRCodeScan}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      QRコードスキャン（テスト）
                    </button>
                  </div>
                </div>

                {studentReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>予約している生徒がいません</p>
                    <p className="text-sm mt-2">QRコードをスキャンして生徒を追加してください</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {reservation.student_name}
                            </h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4" />
                                <span>{reservation.student_email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4" />
                                <span>{reservation.student_phone}</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                reservation.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : reservation.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {reservation.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {reservation.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                                {reservation.status === 'confirmed' ? '参加確定' : 
                                 reservation.status === 'pending' ? '参加待ち' : 'キャンセル'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3 flex space-x-2">
                            {reservation.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                >
                                  確定
                                </button>
                                <button
                                  onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                                >
                                  キャンセル
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonScheduleManagement;
