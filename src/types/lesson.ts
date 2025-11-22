// レッスン関連の型定義

export interface LessonSchedule {
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
}

export interface CalendarLessonSchedule extends LessonSchedule {
  color?: string;
}

export interface LessonSchool {
  id: string;
  name: string;
  store_email: string;
}

export interface CustomerParticipation {
  id: string;
  schedule_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: 'confirmed' | 'cancelled';
  participation_date: string;
  created_at: string;
}

export interface LessonCompletion {
  id: string;
  schedule_id: string;
  lesson_title: string;
  completed_by: string;
  completed_at: string;
  points_distributed: boolean;
  total_participants: number;
  points_given: number;
}

export interface ScheduleFormData {
  lesson_school_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  price: number;
}

export interface LessonPointsResponse {
  success: boolean;
  message: string;
  total_participants?: number;
  total_points?: number;
  completion_id?: string;
}
