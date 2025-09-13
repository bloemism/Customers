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
    <div className="bg-gray-100 rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-gray-600" />
          レッスンカレンダー
        </h3>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={goToPreviousMonth}
            className="p-1 sm:p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <span className="text-sm sm:text-lg font-medium text-gray-800 min-w-[80px] sm:min-w-[120px] text-center">
            {currentDate.getFullYear()}年{monthNames[currentDate.getMonth()]}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1 sm:p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-200"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-medium text-gray-700 py-1 sm:py-2 bg-gray-200 rounded"
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((date, index) => {
          const daySchedules = getSchedulesForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);

          return (
            <div
              key={index}
              className={`
                min-h-[60px] sm:min-h-[80px] border border-gray-300 p-1 sm:p-2 cursor-pointer transition-all duration-200 rounded-lg
                ${isCurrentMonthDay ? 'bg-white hover:bg-gray-50 hover:shadow-md' : 'bg-gray-50 hover:bg-gray-100'}
                ${isTodayDate ? 'bg-gray-300 border-gray-500 shadow-lg ring-2 ring-gray-400' : ''}
                ${isSelectedDate ? 'bg-gray-400 border-gray-600 shadow-lg ring-2 ring-gray-500' : ''}
                ${daySchedules.length > 0 ? 'bg-gray-200 border-gray-400 shadow-md' : ''}
              `}
              onClick={() => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                onDateClick(dateString);
              }}
            >
              <div className="flex flex-col h-full">
                <div className={`
                  text-xs sm:text-sm font-medium mb-0.5 sm:mb-1
                  ${isCurrentMonthDay ? 'text-gray-800' : 'text-gray-400'}
                  ${isTodayDate ? 'text-gray-900 font-bold' : ''}
                  ${isSelectedDate ? 'text-gray-900 font-bold' : ''}
                `}>
                  {date.getDate()}
                </div>
                
                {/* スケジュール表示 */}
                <div className="flex-1 space-y-0.5 sm:space-y-1">
                  {daySchedules.slice(0, 1).map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`
                        text-xs p-0.5 sm:p-1 rounded-lg truncate cursor-pointer shadow-sm
                        bg-gray-600 text-white font-medium
                        hover:bg-gray-700 hover:shadow-md transition-all duration-200
                      `}
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
                    <div className="text-xs text-gray-700 text-center font-medium bg-gray-300 rounded px-1">
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
      <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-300">
        <div className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2 font-medium">凡例:</div>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 border border-gray-500 rounded shadow-sm"></div>
            <span className="text-xs text-gray-700 font-medium">今日</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 border border-gray-600 rounded shadow-sm"></div>
            <span className="text-xs text-gray-700 font-medium">選択日</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-200 border border-gray-400 rounded shadow-sm"></div>
            <span className="text-xs text-gray-700 font-medium">レッスン日</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonCalendar;
