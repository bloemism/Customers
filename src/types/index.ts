export type SupportedLanguage = 'ja' | 'en' | 'ko' | 'zh';

// ユーザー関連
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  current_points: number;
  total_points_earned: number;
  created_at: string;
  updated_at: string;
}

// 店舗関連
export interface Store {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  business_hours: BusinessHours;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images?: StoreImage[];
}

export interface StoreImage {
  id: string;
  store_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  is_closed?: boolean;
}

// 商品関連
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  category?: ProductCategory;
  store?: Store;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

// 注文関連
export interface Order {
  id: string;
  user_id: string;
  store_id: string;
  stripe_payment_intent_id?: string;
  total_amount: number;
  points_earned: number;
  points_used: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  store?: Store;
  user?: User;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product?: Product;
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

// ポイント関連
export interface PointHistory {
  id: string;
  user_id: string;
  order_id?: string;
  points_change: number;
  description: string;
  created_at: string;
  order?: Order;
}

// 位置情報関連
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// 決済関連
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

// アプリケーション状態
export interface AppState {
  isLoading: boolean;
  error: string | null;
  language: SupportedLanguage;
  userLocation: Location | null;
  selectedStore: Store | null;
  selectedProduct: Product | null;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// 検索・フィルター関連
export interface StoreSearchParams {
  latitude: number;
  longitude: number;
  radius?: number; // km
  category?: string;
  keyword?: string;
}

export interface ProductSearchParams {
  store_id?: string;
  category_id?: string;
  keyword?: string;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
}
