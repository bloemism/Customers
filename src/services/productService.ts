import { supabase } from '../lib/supabase';

export interface Product {
  id: string;
  name: string;
  category: string;
  color: string;
  base_price: number;
  is_active: boolean;
  store_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductPriceHistory {
  id: string;
  product_id: string;
  old_price?: number;
  new_price: number;
  changed_at: string;
  changed_by?: string;
}

export class ProductService {
  // 商品一覧を取得
  static async getAllProducts(storeId?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('name');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('商品取得エラー:', error);
        throw new Error('商品の取得に失敗しました');
      }

      return data || [];
    } catch (error) {
      console.error('商品取得エラー:', error);
      throw error;
    }
  }

  // 有効な商品のみ取得
  static async getActiveProducts(storeId?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('有効商品取得エラー:', error);
        throw new Error('有効商品の取得に失敗しました');
      }

      return data || [];
    } catch (error) {
      console.error('有効商品取得エラー:', error);
      throw error;
    }
  }

  // カテゴリ別商品を取得
  static async getProductsByCategory(category: string, storeId?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('カテゴリ別商品取得エラー:', error);
        throw new Error('カテゴリ別商品の取得に失敗しました');
      }

      return data || [];
    } catch (error) {
      console.error('カテゴリ別商品取得エラー:', error);
      throw error;
    }
  }

  // 色別商品を取得
  static async getProductsByColor(color: string, storeId?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('color', color)
        .eq('is_active', true)
        .order('name');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('色別商品取得エラー:', error);
        throw new Error('色別商品の取得に失敗しました');
      }

      return data || [];
    } catch (error) {
      console.error('色別商品取得エラー:', error);
      throw error;
    }
  }

  // 商品を検索
  static async searchProducts(searchTerm: string, storeId?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('name');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('商品検索エラー:', error);
        throw new Error('商品の検索に失敗しました');
      }

      return data || [];
    } catch (error) {
      console.error('商品検索エラー:', error);
      throw error;
    }
  }

  // 商品を追加
  static async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) {
        console.error('商品追加エラー:', error);
        throw new Error('商品の追加に失敗しました');
      }

      return data;
    } catch (error) {
      console.error('商品追加エラー:', error);
      throw error;
    }
  }

  // 商品を更新
  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('商品更新エラー:', error);
        throw new Error('商品の更新に失敗しました');
      }

      return data;
    } catch (error) {
      console.error('商品更新エラー:', error);
      throw error;
    }
  }

  // 商品を削除
  static async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('商品削除エラー:', error);
        throw new Error('商品の削除に失敗しました');
      }
    } catch (error) {
      console.error('商品削除エラー:', error);
      throw error;
    }
  }

  // 商品の状態を切り替え
  static async toggleProductStatus(id: string): Promise<Product> {
    try {
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('商品状態取得エラー:', fetchError);
        throw new Error('商品の状態取得に失敗しました');
      }

      const newStatus = !currentProduct.is_active;

      const { data, error } = await supabase
        .from('products')
        .update({ is_active: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('商品状態更新エラー:', error);
        throw new Error('商品の状態更新に失敗しました');
      }

      return data;
    } catch (error) {
      console.error('商品状態切り替えエラー:', error);
      throw error;
    }
  }

  // 商品カテゴリ一覧を取得
  static async getAllCategories(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('カテゴリ取得エラー:', error);
        throw new Error('カテゴリの取得に失敗しました');
      }

      return data || [];
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
      throw error;
    }
  }

  // 商品価格履歴を取得
  static async getProductPriceHistory(productId: string): Promise<ProductPriceHistory[]> {
    try {
      const { data, error } = await supabase
        .from('product_price_history')
        .select('*')
        .eq('product_id', productId)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('価格履歴取得エラー:', error);
        throw new Error('価格履歴の取得に失敗しました');
      }

      return data || [];
    } catch (error) {
      console.error('価格履歴取得エラー:', error);
      throw error;
    }
  }

  // 商品の統計情報を取得
  static async getProductStats(storeId?: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalCategories: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
  }> {
    try {
      const products = await this.getAllProducts(storeId);
      const categories = new Set(products.map(p => p.category));
      
      const prices = products.map(p => p.base_price);
      const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
      
      return {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.is_active).length,
        totalCategories: categories.size,
        averagePrice: Math.round(averagePrice),
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 0
        }
      };
    } catch (error) {
      console.error('統計情報取得エラー:', error);
      throw error;
    }
  }

  // 商品を店舗に紐付け
  static async assignProductsToStore(productIds: string[], storeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ store_id: storeId })
        .in('id', productIds);

      if (error) {
        console.error('商品店舗紐付けエラー:', error);
        throw new Error('商品の店舗紐付けに失敗しました');
      }
    } catch (error) {
      console.error('商品店舗紐付けエラー:', error);
      throw error;
    }
  }
}
