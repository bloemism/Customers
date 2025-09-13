import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { 
  Calendar,
  Clock,
  Users,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  X,
  Mail,
  Phone
} from 'lucide-react';
import LessonCalendar from '../components/LessonCalendar';
import {
  loadLessonSchools,
  loadLessonSchedules,
  loadCustomerParticipations,
  loadLessonCompletions,
  saveSchedule,
  deleteSchedule,
  updateCustomerParticipation,
  completeLesson
} from '../services/lessonService';
import { supabase } from '../lib/supabase';
import type {
  LessonSchedule,
  LessonSchool,
  CustomerParticipation,
  LessonCompletion,
  ScheduleFormData,
  CalendarLessonSchedule
} from '../types/lesson';

// メッセージタイプ
type MessageType = 'success' | 'error';

const LessonScheduleManagement: React.FC = () => {
  const { user } = useSimpleAuth();
  
  // 状態管理
  const [lessonSchedules, setLessonSchedules] = useState<LessonSchedule[]>([]);
  const [lessonSchools, setLessonSchools] = useState<LessonSchool[]>([]);
  const [customerParticipations, setCustomerParticipations] = useState<CustomerParticipation[]>([]);
  const [lessonCompletions, setLessonCompletions] = useState<LessonCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<LessonSchedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<LessonSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('success');
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  
  // フォームデータ
  const [formData, setFormData] = useState<ScheduleFormData>({
    lesson_school_id: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    max_participants: 1,
    price: 0
  });
  
  // レッスンスクール読み込み
  const loadLessonSchoolsData = async () => {
    try {
      const data = await loadLessonSchools(user?.email || '');
          setLessonSchools(data);
      } catch (error) {
        console.error('レッスンスクール読み込みエラー:', error);
      }
    };

  // レッスンスケジュール読み込み
  const loadLessonSchedulesData = async () => {
    try {
      const data = await loadLessonSchedules(user?.email || '');
      setLessonSchedules(data);
      } catch (error) {
        console.error('レッスンスケジュール読み込みエラー:', error);
    }
  };

  // 顧客参加情報読み込み
  const loadCustomerParticipationsData = async () => {
    try {
      const data = await loadCustomerParticipations();
      setCustomerParticipations(data);
      } catch (error) {
      console.error('顧客参加情報読み込みエラー:', error);
    }
  };

  // レッスン完了記録読み込み
  const loadLessonCompletionsData = async () => {
    try {
      const data = await loadLessonCompletions(user?.email || '');
      setLessonCompletions(data);
    } catch (error) {
      console.error('レッスン完了記録読み込みエラー:', error);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    if (user) {
      Promise.all([
        loadLessonSchoolsData(),
        loadLessonSchedulesData(),
        loadCustomerParticipationsData(),
        loadLessonCompletionsData()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);


  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await saveSchedule(formData, user.email, editingSchedule?.id);
      
      setMessage(editingSchedule ? 'レッスンスケジュールを更新しました' : '新しいレッスンスケジュールを作成しました');
      setMessageType('success');
      setIsEditing(false);
      setEditingSchedule(null);
      resetForm();
      loadLessonSchedulesData();
    } catch (error) {
      console.error('スケジュール保存エラー:', error);
      setMessage('スケジュールの保存中にエラーが発生しました');
      setMessageType('error');
    }
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      lesson_school_id: '',
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      max_participants: 1,
      price: 0
    });
  };

  // 新規作成開始
  const startCreate = () => {
    setIsEditing(true);
    setEditingSchedule(null);
    resetForm();
    
    // 新規作成フォーム表示時に自動スクロール
    setTimeout(() => {
      const editForm = document.getElementById('edit-form');
      if (editForm) {
        editForm.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  // 編集開始
  const startEdit = (schedule: LessonSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      lesson_school_id: schedule.lesson_school_id,
      title: schedule.title,
      description: schedule.description,
      date: schedule.date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      max_participants: schedule.max_participants,
      price: schedule.price
    });
    setIsEditing(true);
    
    // 編集フォーム表示時に自動スクロール
    setTimeout(() => {
      const editForm = document.getElementById('edit-form');
      if (editForm) {
        editForm.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  // 削除
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('このスケジュールを削除しますか？')) return;

    try {
      await deleteSchedule(scheduleId);
      setMessage('スケジュールを削除しました');
      setMessageType('success');
      loadLessonSchedulesData();
      
      if (selectedSchedule?.id === scheduleId) {
        setSelectedSchedule(null);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      setMessage('削除中にエラーが発生しました');
      setMessageType('error');
    }
  };

  // スケジュール選択
  const handleScheduleClick = (schedule: LessonSchedule) => {
    setSelectedSchedule(schedule);
    setSelectedDate(schedule.date);
  };

  // 日付クリック
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  };

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
  const calendarSchedules: CalendarLessonSchedule[] = lessonSchedules.map(schedule => ({
    ...schedule,
    color: getRandomColor(schedule.id)
  }));

  // 顧客参加状況更新
  const handleCustomerParticipation = async (participationId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      await updateCustomerParticipation(participationId, newStatus);

      // 参加者数の更新
      if (selectedSchedule) {
        const participation = customerParticipations.find(p => p.id === participationId);
        if (participation) {
          const increment = newStatus === 'confirmed' ? 1 : -1;
          const { error: updateError } = await supabase
            .from('new_lesson_schedules')
            .update({
              current_participants: selectedSchedule.current_participants + increment
            })
            .eq('id', selectedSchedule.id);

          if (updateError) throw updateError;
        }
      }

      loadCustomerParticipationsData();
      loadLessonSchedulesData();
      setMessage(`参加状況を${newStatus === 'confirmed' ? '確定' : 'キャンセル'}に更新しました`);
      setMessageType('success');
    } catch (error) {
      console.error('参加状況更新エラー:', error);
      setMessage('参加状況の更新中にエラーが発生しました');
      setMessageType('error');
    }
  };

  // QRコードスキャン（テスト用）
  const handleQRScan = () => {
    setMessage('QRコードスキャン機能は開発中です');
    setMessageType('success');
  };

  // レッスン終了処理
  const handleCompleteLesson = async (scheduleId: string) => {
    if (!user || !confirm('レッスンを終了して、参加者にポイントを配布しますか？')) return;

    setIsCompletingLesson(true);
    try {
      const result = await completeLesson(scheduleId, user.email);

      if (result.success) {
        setMessage(`レッスン終了！${result.total_participants}名の参加者に合計${result.total_points}ポイントを配布しました`);
        setMessageType('success');
        
        // データを再読み込み
        loadLessonCompletionsData();
        loadCustomerParticipationsData();
      } else {
        setMessage(result.message || 'ポイント配布に失敗しました');
        setMessageType('error');
      }
    } catch (error) {
      console.error('レッスン終了エラー:', error);
      setMessage('レッスン終了処理中にエラーが発生しました');
      setMessageType('error');
    } finally {
      setIsCompletingLesson(false);
    }
  };

  // レッスンが既に完了しているかチェック
  const isLessonCompleted = (scheduleId: string) => {
    return lessonCompletions.some(completion => completion.schedule_id === scheduleId);
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
    <div className="min-h-screen bg-sky-200">
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
              新規講座作成
              </button>
            )}
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg shadow-sm flex items-center justify-between ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-800' 
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            <span>{message}</span>
            <button
              onClick={() => setMessage('')}
              className="text-current hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* スケジュール作成・編集フォーム */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-4 sm:p-6 mb-6 sm:mb-8" id="edit-form">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSchedule ? 'レッスンスケジュール編集' : '新規レッスンスケジュール作成'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    レッスンスクール
                  </label>
                  <select
                    value={formData.lesson_school_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, lesson_school_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">スクールを選択してください</option>
                    {lessonSchools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    レッスンタイトル
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="レッスンタイトルを入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    詳細説明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                    開催日
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      開始時間
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      終了時間
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      required
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
                      value={formData.max_participants}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 1 }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      料金（円）
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                </div>
              </div>
            </div>

            {/* ボタン */}
              <div className="flex justify-end space-x-3">
              <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingSchedule(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingSchedule ? '更新' : '作成'}
              </button>
            </div>
            </form>
          </div>
        )}

        {/* カレンダー表示 */}
        <div className="mb-4 sm:mb-6">
          <LessonCalendar
            schedules={calendarSchedules}
            onDateClick={handleDateClick}
            onScheduleClick={handleScheduleClick}
            selectedDate={selectedDate}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* 左側：スケジュール一覧 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                レッスンスケジュール
              {selectedDate && (
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-normal text-gray-500">
                  ({selectedDate})
                </span>
              )}
              </h3>
              <span className="text-xs sm:text-sm text-gray-500">
                {selectedDate 
                  ? lessonSchedules.filter(s => s.date === selectedDate).length 
                  : lessonSchedules.length
                }件
              </span>
            </div>

            {(() => {
              const filteredSchedules = selectedDate 
                ? lessonSchedules.filter(s => s.date === selectedDate)
                : lessonSchedules;
              
              return filteredSchedules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>
                    {selectedDate 
                      ? `${selectedDate}のレッスンスケジュールがありません`
                      : '登録されたレッスンスケジュールがありません'
                    }
                  </p>
                <p className="text-sm mt-2">新規作成ボタンから追加してください</p>
              </div>
            ) : (
              <div className="space-y-4">
                  {filteredSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-colors ${
                      selectedSchedule?.id === schedule.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleScheduleClick(schedule)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base truncate">{schedule.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 truncate">{schedule.lesson_school_name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{new Date(schedule.date + 'T00:00:00').toLocaleDateString('ja-JP')}</span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{schedule.start_time} - {schedule.end_time}</span>
                          </div>
                        </div>
                        <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-700 line-clamp-2">
                          {schedule.description.length > 80
                            ? schedule.description.substring(0, 80) + '...'
                            : schedule.description
                          }
                        </div>
                        <div className="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
                          <span className="text-blue-600 font-medium">
                            ¥{schedule.price.toLocaleString()}
                          </span>
                          <span className="text-gray-600">
                            参加者: {schedule.current_participants}/{schedule.max_participants}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 sm:ml-4 flex space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(schedule);
                          }}
                          className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSchedule(schedule.id);
                          }}
                          className="p-1 sm:p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              );
            })()}
          </div>

          {/* 右側：生徒予約一覧 */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              {selectedSchedule ? `${selectedSchedule.title} の予約状況` : '予約管理'}
            </h3>
            
            {!selectedSchedule ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>左側のスケジュールを選択してください</p>
                <p className="text-sm mt-2">生徒の予約状況が表示されます</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-gray-600">
                    参加者: {selectedSchedule.current_participants}/{selectedSchedule.max_participants}人
                    <br />
                    <span className="text-xs text-gray-500">
                      レッスン完了状況: {isLessonCompleted(selectedSchedule.id) ? '完了済み' : '未完了'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleQRScan}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      QRコードスキャン（テスト）
                    </button>
                    {!isLessonCompleted(selectedSchedule.id) && (
                      <button
                        onClick={() => handleCompleteLesson(selectedSchedule.id)}
                        disabled={isCompletingLesson}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isCompletingLesson ? '処理中...' : 'レッスン終了'}
                      </button>
                    )}
                    {isLessonCompleted(selectedSchedule.id) && (
                      <span className="px-3 py-1 bg-gray-500 text-white rounded text-sm">
                        完了済み
                      </span>
                    )}
                  </div>
                </div>

                {/* 顧客参加情報 */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">顧客参加状況</h4>
                  {customerParticipations.filter(p => p.schedule_id === selectedSchedule.id).length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                      <p>参加している顧客がいません</p>
                  </div>
                ) : (
                    <div className="space-y-2">
                      {customerParticipations
                        .filter(p => p.schedule_id === selectedSchedule.id)
                        .map((participation) => (
                        <div
                          key={participation.id}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                          <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">
                                {participation.customer_name}
                              </h5>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4" />
                                  <span>{participation.customer_email}</span>
                              </div>
                                {participation.customer_phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4" />
                                    <span>{participation.customer_phone}</span>
                              </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                participation.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {participation.status === 'confirmed' ? '参加中' : 'キャンセル'}
                              </span>
                                <button
                                onClick={() => handleCustomerParticipation(
                                  participation.id,
                                  participation.status === 'confirmed' ? 'cancelled' : 'confirmed'
                                )}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  participation.status === 'confirmed'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                } transition-colors`}
                              >
                                {participation.status === 'confirmed' ? 'キャンセル' : '参加'}
                                </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>

                {/* レッスン完了記録 */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">レッスン完了記録</h4>
                  {lessonCompletions.filter(c => c.schedule_id === selectedSchedule.id).length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                      <p>まだレッスンは完了していません</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lessonCompletions
                        .filter(c => c.schedule_id === selectedSchedule.id)
                        .map((completion) => (
                        <div
                          key={completion.id}
                          className="border border-gray-200 rounded-lg p-3 bg-green-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">
                                レッスン完了
                              </h5>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>完了日時: {new Date(completion.completed_at).toLocaleString('ja-JP')}</div>
                                <div>参加者数: {completion.total_participants}名</div>
                                <div>配布ポイント: {completion.points_given}ポイント</div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                完了済み
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 生徒予約情報 */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">生徒予約情報</h4>
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>予約している生徒がいません</p>
                    <p className="text-sm mt-2">QRコードをスキャンして生徒を追加してください</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonScheduleManagement;
