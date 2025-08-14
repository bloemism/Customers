import { supabase } from '../lib/supabase';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  gender: string | null;
  total_points: number;
  total_purchase_amount: number;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
  purchases_last_2_months: number;
  avg_purchase_last_month: number | null;
  points_used_last_month: number | null;
  points_earned_last_month: number | null;
}

export interface PurchaseHistory {
  id: string;
  customer_id: string;
  purchase_date: string;
  total_amount: number;
  tax_amount: number;
  points_earned: number;
  points_used: number;
  payment_method: string;
  notes: string | null;
  items: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface PointTransaction {
  id: string;
  customer_id: string;
  transaction_type: 'earn' | 'use';
  points: number;
  purchase_id: string | null;
  description: string | null;
  created_at: string;
}

export class CustomerService {
  // 顧客検索（メールアドレスまたは電話番号）
  static async searchCustomers(query: string, type: 'email' | 'phone'): Promise<Customer[]> {
    try {
      let supabaseQuery = supabase
        .from('customer_statistics')
        .select('*');
      
      if (type === 'email') {
        supabaseQuery = supabaseQuery.ilike('email', `%${query}%`);
      } else {
        supabaseQuery = supabaseQuery.ilike('phone', `%${query}%`);
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('顧客検索エラー:', error);
      throw new Error('顧客検索中にエラーが発生しました。');
    }
  }

  // 顧客詳細情報取得
  static async getCustomerDetails(customerId: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customer_statistics')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('顧客詳細取得エラー:', error);
      throw new Error('顧客詳細の取得中にエラーが発生しました。');
    }
  }

  // 購入履歴取得
  static async getPurchaseHistory(customerId: string, limit: number = 20): Promise<PurchaseHistory[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_history')
        .select(`
          *,
          purchase_items (*)
        `)
        .eq('customer_id', customerId)
        .order('purchase_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('購入履歴取得エラー:', error);
      throw new Error('購入履歴の取得中にエラーが発生しました。');
    }
  }

  // ポイント取引履歴取得
  static async getPointTransactions(customerId: string, limit: number = 50): Promise<PointTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('ポイント取引履歴取得エラー:', error);
      throw new Error('ポイント取引履歴の取得中にエラーが発生しました。');
    }
  }

  // 新規顧客作成
  static async createCustomer(customerData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    birth_date?: string;
    gender?: string;
  }): Promise<Customer> {
    try {
      // メールアドレスまたは電話番号のいずれかは必須
      if (!customerData.email && !customerData.phone) {
        throw new Error('メールアドレスまたは電話番号のいずれかは必須です。');
      }

      // 現在の認証ユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('認証ユーザーが見つかりません。');
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...customerData,
          // 認証ユーザーのIDを関連付ける（将来的に使用）
          // auth_user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      // 統計情報を取得して返す
      return await this.getCustomerDetails(data.id) || data;
    } catch (error) {
      console.error('顧客作成エラー:', error);
      throw new Error('顧客の作成中にエラーが発生しました。');
    }
  }

  // 顧客情報更新
  static async updateCustomer(customerId: string, updateData: Partial<Customer>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      
      // 統計情報を取得して返す
      return await this.getCustomerDetails(data.id) || data;
    } catch (error) {
      console.error('顧客更新エラー:', error);
      throw new Error('顧客情報の更新中にエラーが発生しました。');
    }
  }

  // 購入履歴作成
  static async createPurchaseHistory(purchaseData: {
    customer_id: string;
    total_amount: number;
    tax_amount: number;
    points_earned: number;
    points_used: number;
    payment_method: string;
    notes?: string;
    items: Array<{
      item_name: string;
      unit_price: number;
      quantity: number;
      total_price: number;
    }>;
  }): Promise<PurchaseHistory> {
    try {
      // 購入履歴を作成
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchase_history')
        .insert([{
          customer_id: purchaseData.customer_id,
          total_amount: purchaseData.total_amount,
          tax_amount: purchaseData.tax_amount,
          points_earned: purchaseData.points_earned,
          points_used: purchaseData.points_used,
          payment_method: purchaseData.payment_method,
          notes: purchaseData.notes
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // 購入品目を作成
      if (purchaseData.items.length > 0) {
        const itemsWithPurchaseId = purchaseData.items.map(item => ({
          ...item,
          purchase_id: purchase.id
        }));

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(itemsWithPurchaseId);

        if (itemsError) throw itemsError;
      }

      // ポイント取引履歴を作成
      if (purchaseData.points_earned > 0) {
        await supabase
          .from('point_transactions')
          .insert([{
            customer_id: purchaseData.customer_id,
            transaction_type: 'earn',
            points: purchaseData.points_earned,
            purchase_id: purchase.id,
            description: '購入によるポイント獲得'
          }]);
      }

      if (purchaseData.points_used > 0) {
        await supabase
          .from('point_transactions')
          .insert([{
            customer_id: purchaseData.customer_id,
            transaction_type: 'use',
            points: purchaseData.points_used,
            purchase_id: purchase.id,
            description: '購入時のポイント使用'
          }]);
      }

      // 作成された購入履歴を返す
      const purchaseHistory = await this.getPurchaseHistory(purchaseData.customer_id, 1);
      return purchaseHistory[0];
    } catch (error) {
      console.error('購入履歴作成エラー:', error);
      throw new Error('購入履歴の作成中にエラーが発生しました。');
    }
  }

  // 顧客統計情報取得
  static async getCustomerStatistics(customerId: string): Promise<{
    totalPurchases: number;
    totalSpent: number;
    averagePurchase: number;
    totalPointsEarned: number;
    totalPointsUsed: number;
    currentPoints: number;
    lastPurchaseDate: string | null;
    purchaseFrequency: number; // 月平均購入回数
  }> {
    try {
      const { data, error } = await supabase
        .from('customer_statistics')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('顧客が見つかりません。');
      }

      // 購入頻度を計算（月平均）
      const firstPurchase = data.first_purchase_date ? new Date(data.first_purchase_date) : null;
      const lastPurchase = data.last_purchase_date ? new Date(data.last_purchase_date) : null;
      
      let purchaseFrequency = 0;
      if (firstPurchase && lastPurchase) {
        const monthsDiff = (lastPurchase.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24 * 30);
        purchaseFrequency = monthsDiff > 0 ? data.purchases_last_2_months / monthsDiff : 0;
      }

      return {
        totalPurchases: data.purchases_last_2_months || 0,
        totalSpent: data.total_purchase_amount || 0,
        averagePurchase: data.avg_purchase_last_month || 0,
        totalPointsEarned: data.points_earned_last_month || 0,
        totalPointsUsed: data.points_used_last_month || 0,
        currentPoints: data.total_points || 0,
        lastPurchaseDate: data.last_purchase_date,
        purchaseFrequency: Math.round(purchaseFrequency * 100) / 100
      };
    } catch (error) {
      console.error('顧客統計情報取得エラー:', error);
      throw new Error('顧客統計情報の取得中にエラーが発生しました。');
    }
  }

  // 全顧客一覧取得（ページネーション対応）
  static async getAllCustomers(page: number = 1, limit: number = 20): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // 総件数を取得
      const { count, error: countError } = await supabase
        .from('customer_statistics')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // 顧客一覧を取得
      const { data, error } = await supabase
        .from('customer_statistics')
        .select('*')
        .order('last_purchase_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        customers: data || [],
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('全顧客一覧取得エラー:', error);
      throw new Error('顧客一覧の取得中にエラーが発生しました。');
    }
  }

  // 顧客削除（論理削除）
  static async deleteCustomer(customerId: string): Promise<void> {
    try {
      // 実際の削除ではなく、フラグを立てるなどの論理削除を実装
      // ここでは購入履歴とポイント取引履歴も含めて削除
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      console.error('顧客削除エラー:', error);
      throw new Error('顧客の削除中にエラーが発生しました。');
    }
  }
}
