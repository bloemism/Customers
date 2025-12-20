import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Phone,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';
import LessonCalendar from '../components/LessonCalendar';
import {
  loadLessonSchools,
  loadLessonSchedules,
  loadCustomerParticipations,
  loadLessonCompletions,
  saveSchedule,
  deleteSchedule,
  updateCustomerParticipation,
  completeLesson,
  registerCustomerToSchoolByCode
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

// 背景画像
const BG_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1920&q=80';

type MessageType = 'success' | 'error';

const LessonScheduleManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSimpleAuth();
  
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
  const [isAddingParticipation, setIsAddingParticipation] = useState(false);
  const [newParticipation, setNewParticipation] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: ''
  });
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
  const [customerCodeInput, setCustomerCodeInput] = useState('');
  const [selectedSchoolForRegistration, setSelectedSchoolForRegistration] = useState<string>('');
  
  const [formData, setFormData] = useState<ScheduleFormData>({
    lesson_school_id: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    max_participants: 0,
    price: 0
  });

  // データ読み込み関数
  const loadLessonSchoolsData = async () => {
    try {
      const data = await loadLessonSchools(user?.email || '');
      setLessonSchools(data);
    } catch (error) {
      console.error('レッスンスクール読み込みエラー:', error);
    }
  };

  const loadLessonSchedulesData = async () => {
    try {
      const data = await loadLessonSchedules(user?.email || '');
      setLessonSchedules(data);
    } catch (error) {
      console.error('レッスンスケジュール読み込みエラー:', error);
    }
  };

  const loadCustomerParticipationsData = async () => {
    try {
      const data = await loadCustomerParticipations(user?.email || '');
      setCustomerParticipations(data);
    } catch (error) {
      console.error('顧客参加情報読み込みエラー:', error);
    }
  };

  const loadLessonCompletionsData = async () => {
    try {
      const data = await loadLessonCompletions(user?.email || '');
      setLessonCompletions(data);
    } catch (error) {
      console.error('レッスン完了記録読み込みエラー:', error);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.max_participants <= 0) {
      setMessage('最大参加者数を入力してください');
      setMessageType('error');
      return;
    }

    if (formData.price < 0) {
      setMessage('料金を正しく入力してください');
      setMessageType('error');
      return;
    }

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

  const resetForm = () => {
    setFormData({
      lesson_school_id: '',
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      max_participants: 0,
      price: 0
    });
  };

  const startCreate = () => {
    setIsEditing(true);
    setEditingSchedule(null);
    resetForm();
    setTimeout(() => {
      const editForm = document.getElementById('edit-form');
      if (editForm) {
        editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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
    setTimeout(() => {
      const editForm = document.getElementById('edit-form');
      if (editForm) {
        editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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

  const handleScheduleClick = (schedule: LessonSchedule) => {
    setSelectedSchedule(schedule);
    setSelectedDate(schedule.date);
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  };

  const getRandomColor = (id: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const calendarSchedules: CalendarLessonSchedule[] = lessonSchedules.map(schedule => ({
    ...schedule,
    color: getRandomColor(schedule.id)
  }));

  const handleCustomerParticipation = async (participationId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      await updateCustomerParticipation(participationId, newStatus);

      if (selectedSchedule) {
        const participation = customerParticipations.find(p => p.id === participationId);
        if (participation) {
          const increment = newStatus === 'confirmed' ? 1 : -1;
          await supabase
            .from('new_lesson_schedules')
            .update({
              current_participants: selectedSchedule.current_participants + increment
            })
            .eq('id', selectedSchedule.id);
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

  const generateLessonQRCode = async (schedule: LessonSchedule) => {
    try {
      const baseUrl = window.location.origin;
      const lessonUrl = `${baseUrl}/lesson-participation/${schedule.id}`;
      
      const qrData = {
        type: 'lesson_participation',
        schedule_id: schedule.id,
        lesson_title: schedule.title,
        lesson_date: schedule.date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        max_participants: schedule.max_participants,
        price: schedule.price,
        lesson_url: lessonUrl,
        timestamp: new Date().toISOString(),
        app: '87app-customers'
      };

      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: { dark: '#3D4A35', light: '#FAF8F5' }
      });

      const newWindow = window.open('', '_blank', 'width=400,height=550');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>レッスン参加QRコード</title>
              <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600&display=swap" rel="stylesheet">
              <style>
                body { 
                  font-family: 'Noto Serif JP', serif; 
                  text-align: center; 
                  padding: 30px;
                  background: #FAF8F5;
                  color: #2D2A26;
                  margin: 0;
                }
                .container {
                  background: white;
                  padding: 30px;
                  border-radius: 4px;
                  border: 1px solid #E0D6C8;
                  max-width: 320px;
                  margin: 0 auto;
                }
                .title { 
                  font-size: 18px; 
                  color: #5C6B4A; 
                  margin-bottom: 20px;
                  letter-spacing: 0.1em;
                }
                .lesson-name { 
                  font-size: 16px; 
                  margin-bottom: 15px;
                  color: #3D4A35;
                }
                .info { 
                  font-size: 13px; 
                  color: #8A857E; 
                  margin: 8px 0;
                }
                .qr { 
                  margin: 25px 0;
                  padding: 15px;
                  background: #F5F0E8;
                  border-radius: 4px;
                }
                .qr img { 
                  border-radius: 4px; 
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="title">LESSON QR CODE</div>
                <div class="lesson-name">${schedule.title}</div>
                <div class="info">${new Date(schedule.date + 'T00:00:00').toLocaleDateString('ja-JP')}</div>
                <div class="info">${schedule.start_time} - ${schedule.end_time}</div>
                <div class="info">¥${schedule.price.toLocaleString()} / 定員${schedule.max_participants}名</div>
                <div class="qr"><img src="${qrCodeUrl}" alt="QRコード" /></div>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }

      setMessage('QRコードを生成しました');
      setMessageType('success');
    } catch (error) {
      console.error('QRコード生成エラー:', error);
      setMessage('QRコードの生成中にエラーが発生しました');
      setMessageType('error');
    }
  };

  const handleCompleteLesson = async (scheduleId: string) => {
    if (!user || !confirm('レッスンを終了して、参加者にポイントを配布しますか？')) return;

    setIsCompletingLesson(true);
    try {
      const result = await completeLesson(scheduleId, user.email);

      if (result.success) {
        setMessage(`レッスン終了！${result.total_participants}名に${result.total_points}ポイントを配布しました`);
        setMessageType('success');
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

  const isLessonCompleted = (scheduleId: string) => {
    return lessonCompletions.some(completion => completion.schedule_id === scheduleId);
  };

  const handleAddParticipation = async () => {
    if (!selectedSchedule || !newParticipation.customer_name.trim()) {
      setMessage('顧客名を入力してください');
      setMessageType('error');
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_participations')
        .insert([{
          schedule_id: selectedSchedule.id,
          customer_name: newParticipation.customer_name.trim(),
          customer_email: newParticipation.customer_email.trim() || null,
          customer_phone: newParticipation.customer_phone.trim() || null,
          status: 'confirmed',
          notes: newParticipation.notes.trim() || null
        }]);

      if (error) throw error;

      setMessage('顧客の参加を追加しました');
      setMessageType('success');
      setNewParticipation({ customer_name: '', customer_email: '', customer_phone: '', notes: '' });
      setIsAddingParticipation(false);
      loadCustomerParticipationsData();
      loadLessonSchedulesData();
    } catch (error) {
      console.error('参加追加エラー:', error);
      setMessage('参加の追加中にエラーが発生しました');
      setMessageType('error');
    }
  };

  const handleRegisterCustomerToSchool = async () => {
    if (!user || !customerCodeInput.trim() || !selectedSchoolForRegistration) {
      setMessage('顧客コードとスクールを選択してください');
      setMessageType('error');
      return;
    }

    setIsRegisteringCustomer(true);
    try {
      const result = await registerCustomerToSchoolByCode(
        customerCodeInput.trim().toUpperCase(),
        selectedSchoolForRegistration,
        user.email
      );

      if (result.success) {
        setMessage(`${result.customerName || '顧客'}をスクールに登録しました`);
        setMessageType('success');
        setCustomerCodeInput('');
        setSelectedSchoolForRegistration('');
      } else {
        setMessage(result.error || '登録に失敗しました');
        setMessageType('error');
      }
    } catch (error) {
      console.error('顧客登録エラー:', error);
      setMessage('顧客の登録中にエラーが発生しました');
      setMessageType('error');
    } finally {
      setIsRegisteringCustomer(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#FDFCFA',
    border: '1px solid #E0D6C8',
    color: '#2D2A26'
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FAF8F5' }}
      >
        <div className="text-center">
          <div 
            className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: '#E0D6C8', borderTopColor: '#5C6B4A' }}
          />
          <p className="mt-4 text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 無地背景 */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 transition-colors rounded-sm"
              style={{ color: '#2D2A26', fontWeight: 500 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 
                className="text-2xl"
                style={{ 
                  fontFamily: "'Noto Serif JP', serif",
                  color: '#2D2A26'
                }}
              >
                レッスンスケジュール管理
              </h1>
              <p className="text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>
                フラワーレッスンのスケジュールと生徒予約を管理
              </p>
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={startCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm tracking-wide transition-all duration-300"
              style={{ 
                backgroundColor: '#5C6B4A',
                color: '#FAF8F5'
              }}
            >
              <Plus className="w-4 h-4" />
              新規講座作成
            </button>
          )}
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div 
            className="mb-6 p-4 rounded-sm flex items-center justify-between"
            style={{
              backgroundColor: messageType === 'success' ? '#E8EDE4' : '#FEF2F2',
              border: `1px solid ${messageType === 'success' ? '#D1DBC9' : '#FECACA'}`,
              color: messageType === 'success' ? '#5C6B4A' : '#DC2626'
            }}
          >
            <span className="text-sm">{message}</span>
            <button onClick={() => setMessage('')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 編集フォーム */}
        {isEditing && (
          <div 
            id="edit-form"
            className="rounded-sm p-6 mb-8"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid #E0D6C8'
            }}
          >
            <h2 
              className="text-lg mb-6"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26'
              }}
            >
              {editingSchedule ? 'スケジュール編集' : '新規スケジュール作成'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs tracking-wide mb-2" style={{ color: '#2D2A26', fontWeight: 600 }}>
                    レッスンスクール
                  </label>
                  <select
                    value={formData.lesson_school_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, lesson_school_id: e.target.value }))}
                    required
                    className="w-full px-3 py-3 rounded-sm"
                    style={inputStyle}
                  >
                    <option value="">スクールを選択</option>
                    {lessonSchools.map((school) => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-wide mb-2" style={{ color: '#2D2A26', fontWeight: 600 }}>
                    レッスンタイトル
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-3 py-3 rounded-sm"
                    style={inputStyle}
                    placeholder="レッスンタイトル"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs tracking-wide mb-2" style={{ color: '#8A857E' }}>
                  詳細説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-3 rounded-sm"
                  style={inputStyle}
                  placeholder="レッスンの詳細説明"
                />
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs tracking-wide mb-2" style={{ color: '#2D2A26', fontWeight: 600 }}>
                    開催日
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full px-3 py-3 rounded-sm"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-wide mb-2" style={{ color: '#2D2A26', fontWeight: 600 }}>
                    開始時間
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                    className="w-full px-3 py-3 rounded-sm"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-wide mb-2" style={{ color: '#2D2A26', fontWeight: 600 }}>
                    終了時間
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                    className="w-full px-3 py-3 rounded-sm"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-wide mb-2" style={{ color: '#2D2A26', fontWeight: 600 }}>
                    定員
                  </label>
                  <input
                    type="number"
                    value={formData.max_participants || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 0 }))}
                    required
                    min="1"
                    className="w-full px-3 py-3 rounded-sm"
                    style={inputStyle}
                    placeholder="人数"
                  />
                </div>
              </div>

              <div className="w-48">
                <label className="block text-xs tracking-wide mb-2" style={{ color: '#8A857E' }}>
                  料金（円）
                </label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  required
                  min="0"
                  className="w-full px-3 py-3 rounded-sm"
                  style={inputStyle}
                  placeholder="料金"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditingSchedule(null); resetForm(); }}
                  className="px-6 py-3 rounded-sm text-sm"
                  style={{ backgroundColor: '#F5F0E8', color: '#2D2A26', fontWeight: 500 }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-sm text-sm"
                  style={{ backgroundColor: '#5C6B4A', color: '#FAF8F5' }}
                >
                  {editingSchedule ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* カレンダー */}
        <div 
          className="mb-4 sm:mb-6 rounded-sm p-3 sm:p-4 md:p-6"
          style={{ 
            background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 50%, #D4AF37 100%)',
            border: '2px solid #B8941F',
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
          }}
        >
          <LessonCalendar
            schedules={calendarSchedules}
            onDateClick={handleDateClick}
            onScheduleClick={handleScheduleClick}
            selectedDate={selectedDate}
          />
        </div>

        {/* 顧客スクール登録セクション */}
        {lessonSchools.length > 0 && (
          <div 
            className="mb-6 rounded-sm p-6"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid #E0D6C8'
            }}
          >
            <h3 
              className="text-lg mb-4"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26'
              }}
            >
              顧客をスクールに登録
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs tracking-wide mb-2" style={{ color: '#2D2A26', fontWeight: 600 }}>
                  スクールを選択
                </label>
                <select
                  value={selectedSchoolForRegistration}
                  onChange={(e) => setSelectedSchoolForRegistration(e.target.value)}
                  className="w-full px-3 py-3 rounded-sm"
                  style={inputStyle}
                >
                  <option value="">スクールを選択</option>
                  {lessonSchools.map((school) => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs tracking-wide mb-2" style={{ color: '#2D2A26', fontWeight: 600 }}>
                  顧客コード
                </label>
                <input
                  type="text"
                  value={customerCodeInput}
                  onChange={(e) => setCustomerCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-3 rounded-sm"
                  style={inputStyle}
                  placeholder="例: A1234"
                  maxLength={5}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleRegisterCustomerToSchool}
                  disabled={isRegisteringCustomer || !customerCodeInput.trim() || !selectedSchoolForRegistration}
                  className="px-6 py-3 rounded-sm text-sm transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: '#5C6B4A',
                    color: '#FAF8F5'
                  }}
                >
                  {isRegisteringCustomer ? '登録中...' : '登録'}
                </button>
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: '#8A857E' }}>
              顧客コードを入力してスクールに登録すると、顧客のスケジュールページに反映されます
            </p>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* スケジュール一覧 */}
          <div 
            className="rounded-sm p-6"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid #E0D6C8'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-lg"
                style={{ 
                  fontFamily: "'Noto Serif JP', serif",
                  color: '#2D2A26'
                }}
              >
                レッスンスケジュール
                {selectedDate && (
                  <span className="ml-2 text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>
                    ({selectedDate})
                  </span>
                )}
              </h3>
            </div>

            {(() => {
              const filteredSchedules = selectedDate 
                ? lessonSchedules.filter(s => s.date === selectedDate)
                : lessonSchedules;
              
              return filteredSchedules.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: '#E0D6C8' }} />
                  <p style={{ color: '#3D3A36', fontWeight: 500 }}>
                    {selectedDate ? `${selectedDate}のスケジュールはありません` : 'スケジュールがありません'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      onClick={() => handleScheduleClick(schedule)}
                      className="p-4 rounded-sm cursor-pointer transition-all duration-300"
                      style={{ 
                        backgroundColor: selectedSchedule?.id === schedule.id ? '#F5F0E8' : '#FDFCFA',
                        border: `1px solid ${selectedSchedule?.id === schedule.id ? '#5C6B4A' : '#E0D6C8'}`
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 
                            className="text-sm mb-1"
                            style={{ color: '#2D2A26', fontWeight: 500 }}
                          >
                            {schedule.title}
                          </h4>
                          <p className="text-xs mb-2" style={{ color: '#3D3A36', fontWeight: 500 }}>
                            {schedule.lesson_school_name}
                          </p>
                          <div className="flex items-center gap-4 text-xs" style={{ color: '#3D3A36', fontWeight: 500 }}>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(schedule.date + 'T00:00:00').toLocaleDateString('ja-JP')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {schedule.start_time} - {schedule.end_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span style={{ color: '#5C6B4A', fontWeight: 500 }}>
                              ¥{schedule.price.toLocaleString()}
                            </span>
                            <span style={{ color: '#3D3A36', fontWeight: 500 }}>
                              {schedule.current_participants}/{schedule.max_participants}名
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(schedule); }}
                            className="p-2 rounded-sm transition-colors"
                            style={{ color: '#8A857E' }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(schedule.id); }}
                            className="p-2 rounded-sm transition-colors"
                            style={{ color: '#C4856C' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* 予約管理 */}
          <div 
            className="rounded-sm p-6"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid #E0D6C8'
            }}
          >
            <h3 
              className="text-lg mb-4"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26'
              }}
            >
              {selectedSchedule ? `${selectedSchedule.title} の予約状況` : '予約管理'}
            </h3>
            
            {!selectedSchedule ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#E0D6C8' }} />
                <p style={{ color: '#3D3A36', fontWeight: 500 }}>左側のスケジュールを選択してください</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* アクションボタン */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => generateLessonQRCode(selectedSchedule)}
                    className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs transition-colors"
                    style={{ backgroundColor: '#5C6B4A', color: '#FAF8F5' }}
                  >
                    <QrCode className="w-4 h-4" />
                    QRコード生成
                  </button>
                  {!isLessonCompleted(selectedSchedule.id) && (
                    <button
                      onClick={() => handleCompleteLesson(selectedSchedule.id)}
                      disabled={isCompletingLesson}
                      className="px-3 py-2 rounded-sm text-xs transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#C4856C', color: '#FAF8F5' }}
                    >
                      {isCompletingLesson ? '処理中...' : 'レッスン終了'}
                    </button>
                  )}
                  {isLessonCompleted(selectedSchedule.id) && (
                    <span 
                      className="px-3 py-2 rounded-sm text-xs"
                      style={{ backgroundColor: '#E8EDE4', color: '#5C6B4A' }}
                    >
                      完了済み
                    </span>
                  )}
                </div>

                {/* 参加者リスト */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm" style={{ color: '#5A5651' }}>
                      参加者: {selectedSchedule.current_participants}/{selectedSchedule.max_participants}名
                    </p>
                    <button
                      onClick={() => setIsAddingParticipation(!isAddingParticipation)}
                      className="text-xs px-3 py-1 rounded-sm transition-colors"
                      style={{ backgroundColor: '#F5F0E8', color: '#5C6B4A' }}
                    >
                      {isAddingParticipation ? 'キャンセル' : '参加者を追加'}
                    </button>
                  </div>

                  {isAddingParticipation && (
                    <div 
                      className="p-4 rounded-sm mb-4"
                      style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}
                    >
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          value={newParticipation.customer_name}
                          onChange={(e) => setNewParticipation(prev => ({ ...prev, customer_name: e.target.value }))}
                          className="px-3 py-2 rounded-sm text-sm"
                          style={inputStyle}
                          placeholder="顧客名 *"
                        />
                        <input
                          type="email"
                          value={newParticipation.customer_email}
                          onChange={(e) => setNewParticipation(prev => ({ ...prev, customer_email: e.target.value }))}
                          className="px-3 py-2 rounded-sm text-sm"
                          style={inputStyle}
                          placeholder="メール"
                        />
                        <input
                          type="tel"
                          value={newParticipation.customer_phone}
                          onChange={(e) => setNewParticipation(prev => ({ ...prev, customer_phone: e.target.value }))}
                          className="px-3 py-2 rounded-sm text-sm"
                          style={inputStyle}
                          placeholder="電話番号"
                        />
                        <input
                          type="text"
                          value={newParticipation.notes}
                          onChange={(e) => setNewParticipation(prev => ({ ...prev, notes: e.target.value }))}
                          className="px-3 py-2 rounded-sm text-sm"
                          style={inputStyle}
                          placeholder="備考"
                        />
                      </div>
                      <button
                        onClick={handleAddParticipation}
                        className="w-full py-2 rounded-sm text-sm"
                        style={{ backgroundColor: '#5C6B4A', color: '#FAF8F5' }}
                      >
                        追加
                      </button>
                    </div>
                  )}

                  {customerParticipations.filter(p => p.schedule_id === selectedSchedule.id).length === 0 ? (
                    <div 
                      className="text-center py-8 rounded-sm"
                      style={{ backgroundColor: '#FDFCFA' }}
                    >
                      <p className="text-sm" style={{ color: '#8A857E' }}>参加者がいません</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerParticipations
                        .filter(p => p.schedule_id === selectedSchedule.id)
                        .map((participation) => (
                          <div
                            key={participation.id}
                            className="p-3 rounded-sm"
                            style={{ backgroundColor: '#FDFCFA', border: '1px solid #E0D6C8' }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>
                                  {participation.customer_name}
                                </p>
                                <div className="flex items-center gap-3 text-xs mt-1" style={{ color: '#8A857E' }}>
                                  {participation.customer_email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {participation.customer_email}
                                    </span>
                                  )}
                                  {participation.customer_phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {participation.customer_phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="px-2 py-1 rounded-sm text-xs"
                                  style={{ 
                                    backgroundColor: participation.status === 'confirmed' ? '#E8EDE4' : '#FEE2E2',
                                    color: participation.status === 'confirmed' ? '#5C6B4A' : '#DC2626'
                                  }}
                                >
                                  {participation.status === 'confirmed' ? '参加' : 'キャンセル'}
                                </span>
                                <button
                                  onClick={() => handleCustomerParticipation(
                                    participation.id,
                                    participation.status === 'confirmed' ? 'cancelled' : 'confirmed'
                                  )}
                                  className="px-2 py-1 rounded-sm text-xs transition-colors"
                                  style={{ 
                                    backgroundColor: participation.status === 'confirmed' ? '#FEE2E2' : '#E8EDE4',
                                    color: participation.status === 'confirmed' ? '#DC2626' : '#5C6B4A'
                                  }}
                                >
                                  {participation.status === 'confirmed' ? '取消' : '復帰'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
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
