import { supabase } from '../lib/supabase';
import type { Product, ProductSearchParams, ApiResponse } from '../types';

export class ProductService {
  // 店舗の商品一覧を取得
  static async getProductsByStore(storeId: string, params?: ProductSearchParams): Promise<ApiResponse<Product[]>> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          images (*),
          category (*)
        `)
        .eq('store_id', storeId)
        .eq('is_available', true);

      // カテゴリフィルター
      if (params?.category_id) {
        query = query.eq('category_id', params.category_id);
      }

      // キーワード検索
      if (params?.keyword) {
        query = query.or(`name.ilike.%${params.keyword}%,description.ilike.%${params.keyword}%`);
      }

      // 価格フィルター
      if (params?.min_price) {
        query = query.gte('price', params.min_price);
      }
      if (params?.max_price) {
        query = query.lte('price', params.max_price);
      }

      // 在庫フィルター
      if (params?.in_stock_only) {
        query = query.gt('stock_quantity', 0);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in getProductsByStore:', error);
      return { data: null, error: '商品の取得に失敗しました', success: false };
    }
  }

  // 商品詳細を取得
  static async getProductById(productId: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images (*),
          category (*),
          store (*)
        `)
        .eq('id', productId)
        .eq('is_available', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in getProductById:', error);
      return { data: null, error: '商品情報の取得に失敗しました', success: false };
    }
  }

  // 商品カテゴリ一覧を取得
  static async getCategories(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in getCategories:', error);
      return { data: null, error: 'カテゴリの取得に失敗しました', success: false };
    }
  }
}
