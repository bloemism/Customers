export interface Customer {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  points: number;
  level: number;
  created_at?: string;
  updated_at?: string;
}

export interface PointHistory {
  id?: string;
  user_id?: string;
  customer_id?: string;
  points: number;
  reason: string;
  type: 'earned' | 'used';
  created_at?: string;
}

/** 決済明細の1品目 */
export interface PaymentItem {
  name?: string;
  item_name?: string;
  unit_price?: number;
  price?: number;
  quantity?: number;
  amount?: number;
}

/** 決済データ（商品明細・小計・税・店舗名等） */
export interface PaymentData {
  items?: PaymentItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  store_name?: string;
}

export interface CustomerPayment {
  id?: string;
  user_id?: string;
  customer_id?: string;
  store_id: string;
  amount: number;
  points_earned?: number;
  points_used: number;
  points_spent?: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  stripe_payment_intent_id?: string;
  payment_data?: PaymentData;
  created_at?: string;
}

export interface FlowerLesson {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  created_at?: string;
}

export interface LessonBooking {
  id?: string;
  user_id: string;
  lesson_id: string;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
}
