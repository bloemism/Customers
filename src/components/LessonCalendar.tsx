import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Users
} from 'lucide-react';

// レッスンスケジュールの型定義
interface LessonSchedule {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  color: string;
}

interface LessonCalendarProps {
  schedules: LessonSchedule[];
  onDateClick: (date: string) => void;
  onScheduleClick: (schedule: LessonSchedule) => void;
}

const LessonCalendar: React.FC<LessonCalendarProps> = ({ 
  schedules, 
  onDateClick, 
  onScheduleClick 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');

  // 3ヶ月分のカレンダーを生成
  const generateCalendarMonths = () => {
    const months = [];
    const startDate = new Date(currentMonth);
    startDate.setMonth(startDate.getMonth() - 1); // 1ヶ月前から

    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      months.push(monthDate);
    }
    return months;
  };

  // 指定された月のカレンダーグリッドを生成
  const generateMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // 月の最初の日と最後の日
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 月の最初の日の曜日（0=日曜日）
    const firstDayOfWeek = firstDay.getDay();
    
    // 前月の日付を取得
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push(new Date(year, month - 1, prevMonthLastDay.getDate() - i));
    }
    
    // 当月の日付を取得
    const currentMonthDays = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      currentMonthDays.push(new Date(year, month, i));
    }
    
    // 次月の日付を取得（6週分のグリッドを作るため）
    const nextMonthDays = [];
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = 42 - totalDays; // 6週 × 7日 = 42
    for (let i = 1; i <= remainingDays; i++) {
      nextMonthDays.push(new Date(year, month + 1, i));
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // 指定された日付のレッスンを取得（日本時間）
  const getSchedulesForDate = (date: Date) => {
    // 日本時間で日付文字列を生成
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return schedules.filter(schedule => schedule.date === dateString);
  };

  // 日付をクリック（日本時間）
  const handleDateClick = (date: Date) => {
    // 日本時間で日付文字列を生成
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    setSelectedDate(dateString);
    onDateClick(dateString);
  };

  // 月を変更
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // 曜日のヘッダー
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // 月名を日本語で取得
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* カレンダーコントロール */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeMonth('prev')}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          レッスンスケジュールカレンダー
        </h2>
        <button
          onClick={() => changeMonth('next')}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 3ヶ月分のカレンダー */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {generateCalendarMonths().map((monthDate, monthIndex) => (
          <div key={monthIndex} className="border border-gray-200 rounded-lg p-4">
            {/* 月のヘッダー */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {getMonthName(monthDate)}
              </h3>
            </div>

            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7 gap-1">
              {generateMonthGrid(monthDate).map((date, dayIndex) => {
                const isCurrentMonth = date.getMonth() === monthDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toISOString().split('T')[0] === selectedDate;
                const daySchedules = getSchedulesForDate(date);
                
                return (
                  <div
                    key={dayIndex}
                    className={`
                      min-h-[60px] p-1 border border-gray-100 cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                      ${isToday ? 'border-blue-300 bg-blue-50' : ''}
                      ${isSelected ? 'border-blue-500 bg-blue-100' : ''}
                      hover:bg-gray-50
                    `}
                    onClick={() => handleDateClick(date)}
                  >
                    {/* 日付 */}
                    <div className={`
                      text-xs font-medium mb-1 text-center
                      ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${isToday ? 'text-blue-600 font-bold' : ''}
                    `}>
                      {date.getDate()}
                    </div>

                    {/* レッスン表示 */}
                    {daySchedules.slice(0, 2).map((schedule, scheduleIndex) => (
                      <div
                        key={schedule.id}
                        className={`
                          text-xs p-1 mb-1 rounded cursor-pointer
                          ${schedule.color || 'bg-blue-500'}
                          text-white font-medium truncate
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleClick(schedule);
                        }}
                        title={`${schedule.title} (${schedule.start_time})`}
                      >
                        {schedule.title}
                      </div>
                    ))}

                    {/* レッスンが3つ以上ある場合 */}
                    {daySchedules.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{daySchedules.length - 2}件
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">凡例</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">レッスンあり</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-300 rounded border border-blue-500"></div>
            <span className="text-gray-600">今日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 rounded border-2 border-blue-500"></div>
            <span className="text-gray-600">選択中</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonCalendar;
