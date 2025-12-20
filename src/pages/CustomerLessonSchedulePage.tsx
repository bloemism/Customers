import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { 
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  ArrowLeft,
  X
} from 'lucide-react';
import { getCustomerLessonSchedules, getCustomerRegisteredSchoolsWithDetails } from '../services/customerLessonService';
import type { LessonSchedule, LessonSchool } from '../types/lesson';
import LessonCalendar from '../components/LessonCalendar';
import type { CalendarLessonSchedule } from '../types/lesson';

const CustomerLessonSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  
  const [schedules, setSchedules] = useState<LessonSchedule[]>([]);
  const [registeredSchools, setRegisteredSchools] = useState<LessonSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<LessonSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (customer?.id) {
      loadData();
    }
  }, [customer]);

  const loadData = async () => {
    if (!customer?.id) return;

    try {
      setLoading(true);
      const [schedulesData, schoolsData] = await Promise.all([
        getCustomerLessonSchedules(customer.id),
        getCustomerRegisteredSchoolsWithDetails(customer.id)
      ]);
      
      setSchedules(schedulesData);
      setRegisteredSchools(schoolsData);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      setMessage('データの読み込みに失敗しました');
      setMessageType('error');
    } finally {
      setLoading(false);
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

  const calendarSchedules: CalendarLessonSchedule[] = schedules.map(schedule => ({
    ...schedule,
    color: getRandomColor(schedule.id)
  }));

  const filteredSchedules = selectedDate 
    ? schedules.filter(s => s.date === selectedDate)
    : schedules;

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
                レッスンスケジュール
              </h1>
              <p className="text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>
                登録しているスクールのレッスン予定
              </p>
            </div>
          </div>
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

        {/* 登録スクール一覧 */}
        {registeredSchools.length > 0 && (
          <div 
            className="mb-6 p-4 rounded-sm"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid #E0D6C8'
            }}
          >
            <h3 
              className="text-sm mb-3"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26',
                fontWeight: 600
              }}
            >
              登録スクール
            </h3>
            <div className="flex flex-wrap gap-2">
              {registeredSchools.map((school) => (
                <span
                  key={school.id}
                  className="px-3 py-1 rounded-sm text-xs"
                  style={{ 
                    backgroundColor: '#F5F0E8',
                    color: '#5C6B4A',
                    fontWeight: 500
                  }}
                >
                  {school.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {registeredSchools.length === 0 ? (
          <div 
            className="text-center py-12 rounded-sm"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid #E0D6C8'
            }}
          >
            <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: '#E0D6C8' }} />
            <p style={{ color: '#3D3A36', fontWeight: 500 }}>
              登録しているスクールがありません
            </p>
            <p className="text-sm mt-2" style={{ color: '#8A857E' }}>
              スクールに登録すると、レッスンスケジュールが表示されます
            </p>
          </div>
        ) : (
          <>
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

            {/* スケジュール一覧 */}
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
                レッスンスケジュール
                {selectedDate && (
                  <span className="ml-2 text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>
                    ({selectedDate})
                  </span>
                )}
              </h3>

              {filteredSchedules.length === 0 ? (
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
                          {schedule.description && (
                            <p className="text-xs mt-2" style={{ color: '#8A857E' }}>
                              {schedule.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerLessonSchedulePage;

