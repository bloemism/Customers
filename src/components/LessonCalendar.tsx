import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarLessonSchedule {
  id: string;
  lesson_school_id: string;
  lesson_school_name?: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  price: number;
  is_active: boolean;
  store_email: string;
  color?: string;
}

interface LessonCalendarProps {
  schedules: CalendarLessonSchedule[];
  onDateClick: (date: string) => void;
  onScheduleClick: (schedule: CalendarLessonSchedule) => void;
  selectedDate?: string;
}

const LessonCalendar: React.FC<LessonCalendarProps> = ({ 
  schedules, 
  onDateClick, 
  onScheduleClick,
  selectedDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 月の移動
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // カレンダーの日付を生成（日本時間）
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 月の最初の日（日本時間）
    const firstDay = new Date(year, month, 1);
    // 月の最初の週の開始日（日曜日）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // 6週間分の日付を生成
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // 指定された日付のスケジュールを取得
  const getSchedulesForDate = (date: Date) => {
    // 日付をYYYY-MM-DD形式の文字列に変換
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return schedules.filter(schedule => schedule.date === dateString);
  };

  // 日付が今日かどうか
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 日付が選択された日かどうか
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return dateString === selectedDate;
  };

  // 日付が現在の月かどうか
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };


  const days = generateCalendarDays();
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div 
      className="rounded-sm shadow-lg p-3 sm:p-4"
      style={{ 
        backgroundColor: 'rgba(255,255,255,0.95)',
        border: '2px solid #B8941F'
      }}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 
          className="text-base sm:text-lg flex items-center"
          style={{ 
            fontFamily: "'Noto Serif JP', serif",
            color: '#2D2A26',
            fontWeight: 600
          }}
        >
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" style={{ color: '#B8941F' }} />
          レッスンカレンダー
        </h3>
        <div className="flex items-center space-x-2 sm:space-x-4">
        <button
            onClick={goToPreviousMonth}
            className="p-1 sm:p-2 transition-colors rounded-full"
            style={{ color: '#2D2A26' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(184, 148, 31, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
          <span 
            className="text-sm sm:text-lg font-medium min-w-[80px] sm:min-w-[120px] text-center"
            style={{ 
              color: '#2D2A26',
              fontWeight: 600
            }}
          >
            {currentDate.getFullYear()}年{monthNames[currentDate.getMonth()]}
          </span>
        <button
            onClick={goToNextMonth}
            className="p-1 sm:p-2 transition-colors rounded-full"
            style={{ color: '#2D2A26' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(184, 148, 31, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        </div>
            </div>

            {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
        {dayNames.map((day, dayIndex) => {
          const isSunday = dayIndex === 0; // 日曜日は最初の要素
          return (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-medium py-1 sm:py-2 rounded-sm"
            style={{ 
              backgroundColor: isSunday ? '#FFE0E0' : '#F4D03F',
              color: isSunday ? '#C62828' : '#2D2A26',
              fontWeight: 600,
              border: isSunday ? '1px solid #E57373' : '1px solid #B8941F'
            }}
          >
                  {day}
                </div>
              );
        })}
            </div>

            {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((date, index) => {
                const daySchedules = getSchedulesForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          const isSunday = date.getDay() === 0; // 日曜日判定
                
                return (
                  <div
              key={index}
                    className="min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 cursor-pointer transition-all duration-200 rounded-sm"
                    style={{
                      backgroundColor: isSunday 
                        ? (isCurrentMonthDay ? '#FFE0E0' : '#FFEBEE') 
                        : (isCurrentMonthDay ? '#FDFCFA' : '#F5F0E8'),
                      border: isTodayDate 
                        ? (isSunday ? '2px solid #E57373' : '2px solid #B8941F')
                        : isSelectedDate 
                        ? (isSunday ? '2px solid #EF5350' : '2px solid #D4AF37')
                        : daySchedules.length > 0 
                        ? (isSunday ? '2px solid #E57373' : '2px solid #F4D03F')
                        : (isSunday ? '1px solid #E57373' : '1px solid #E0D6C8'),
                      boxShadow: isTodayDate || isSelectedDate 
                        ? (isSunday ? '0 2px 8px rgba(229, 115, 115, 0.3)' : '0 2px 8px rgba(212, 175, 55, 0.3)')
                        : daySchedules.length > 0 
                        ? (isSunday ? '0 1px 4px rgba(229, 115, 115, 0.2)' : '0 1px 4px rgba(212, 175, 55, 0.2)')
                        : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (isCurrentMonthDay) {
                        e.currentTarget.style.backgroundColor = isSunday ? '#FFCDD2' : '#F5F0E8';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isCurrentMonthDay) {
                        e.currentTarget.style.backgroundColor = isSunday ? '#FFE0E0' : '#FDFCFA';
                        e.currentTarget.style.boxShadow = isTodayDate || isSelectedDate 
                          ? (isSunday ? '0 2px 8px rgba(229, 115, 115, 0.3)' : '0 2px 8px rgba(212, 175, 55, 0.3)')
                          : daySchedules.length > 0 
                          ? (isSunday ? '0 1px 4px rgba(229, 115, 115, 0.2)' : '0 1px 4px rgba(212, 175, 55, 0.2)')
                          : 'none';
                      }
                    }}
              onClick={() => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                onDateClick(dateString);
              }}
            >
              <div className="flex flex-col h-full">
                    <div 
                      className="text-xs sm:text-sm font-medium mb-0.5 sm:mb-1"
                      style={{ 
                        color: isSunday 
                          ? (isCurrentMonthDay ? '#C62828' : '#E57373')
                          : (isCurrentMonthDay ? '#2D2A26' : '#8A857E'),
                        fontWeight: isTodayDate || isSelectedDate ? 700 : 500
                      }}
                    >
                      {date.getDate()}
                    </div>

                {/* スケジュール表示 */}
                <div className="flex-1 space-y-0.5 sm:space-y-1">
                  {daySchedules.slice(0, 1).map((schedule) => (
                      <div
                        key={schedule.id}
                        className="text-xs p-0.5 sm:p-1 rounded-sm truncate cursor-pointer shadow-sm transition-all duration-200"
                        style={{ 
                          backgroundColor: '#5C6B4A',
                          color: '#FAF8F5',
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4A5D4A';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#5C6B4A';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleClick(schedule);
                        }}
                      title={`${schedule.title} (${schedule.start_time}-${schedule.end_time})`}
                      >
                      <div className="truncate text-xs">{schedule.title}</div>
                      <div className="text-xs opacity-90 hidden sm:block">
                        {schedule.start_time}-{schedule.end_time}
                      </div>
                      </div>
                    ))}
                  {daySchedules.length > 1 && (
                    <div 
                      className="text-xs text-center font-medium rounded-sm px-1"
                      style={{ 
                        backgroundColor: '#F4D03F',
                        color: '#2D2A26',
                        fontWeight: 600,
                        border: '1px solid #B8941F'
                      }}
                    >
                      +{daySchedules.length - 1}件
                      </div>
                    )}
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-2 sm:mt-4 pt-2 sm:pt-4" style={{ borderTop: '1px solid #B8941F' }}>
        <div 
          className="text-xs sm:text-sm mb-1 sm:mb-2 font-medium"
          style={{ color: '#2D2A26', fontWeight: 600 }}
        >
          凡例:
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div 
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm shadow-sm"
              style={{ 
                backgroundColor: '#FDFCFA',
                border: '2px solid #B8941F'
              }}
            ></div>
            <span className="text-xs font-medium" style={{ color: '#2D2A26' }}>今日</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div 
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm shadow-sm"
              style={{ 
                backgroundColor: '#FDFCFA',
                border: '2px solid #D4AF37'
              }}
            ></div>
            <span className="text-xs font-medium" style={{ color: '#2D2A26' }}>選択日</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div 
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm shadow-sm"
              style={{ 
                backgroundColor: '#FDFCFA',
                border: '2px solid #F4D03F'
              }}
            ></div>
            <span className="text-xs font-medium" style={{ color: '#2D2A26' }}>レッスン日</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonCalendar;
