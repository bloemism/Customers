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
  user_id: string;
  points: number;
  reason: string;
  type: 'earned' | 'used';
  created_at?: string;
}

export interface CustomerPayment {
  id?: string;
  user_id: string;
  store_id: string;
  amount: number;
  points_used?: number;
  points_spent?: number;
  points_earned?: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  payment_code?: string;
  payment_date?: string;
  stripe_payment_intent_id?: string;
  payment_data?: {
    items?: Array<{
      name: string;
      price: number;
      quantity: number;
      total: number;
    }>;
    subtotal?: number;
    tax?: number;
    totalAmount?: number;
    storeName?: string;
    paymentCode?: string;
  };
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
