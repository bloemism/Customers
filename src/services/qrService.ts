import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import type { ApiResponse } from '../types';

export interface QRItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface QRSession {
  id: string;
  session_id: string;
  store_id: string;
  total_amount: number;
  items: QRItem[];
  status: 'active' | 'completed' | 'expired';
  expires_at: string;
  created_at: string;
}

export class QRService {
  // QRセッションを作成
  static async createQRSession(
    storeId: string, 
    items: QRItem[]
  ): Promise<ApiResponse<QRSession>> {
    try {
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分後

      const { data, error } = await supabase
        .from('qr_sessions')
        .insert({
          store_id: storeId,
          session_id: sessionId,
          total_amount: totalAmount,
          items: items,
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating QR session:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in createQRSession:', error);
      return { data: null, error: 'QRセッションの作成に失敗しました', success: false };
    }
  }

  // QRコードを生成
  static async generateQRCode(sessionId: string): Promise<ApiResponse<string>> {
    try {
      const qrData = {
        session_id: sessionId,
        timestamp: Date.now(),
        app: '87app-customer'
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return { data: qrCodeDataUrl, error: null, success: true };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return { data: null, error: 'QRコードの生成に失敗しました', success: false };
    }
  }

  // QRセッションを取得
  static async getQRSession(sessionId: string): Promise<ApiResponse<QRSession>> {
    try {
      const { data, error } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching QR session:', error);
        return { data: null, error: error.message, success: false };
      }

      // 有効期限チェック
      if (new Date(data.expires_at) < new Date()) {
        return { data: null, error: 'QRセッションの有効期限が切れています', success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in getQRSession:', error);
      return { data: null, error: 'QRセッションの取得に失敗しました', success: false };
    }
  }

  // QRセッションを完了
  static async completeQRSession(sessionId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('qr_sessions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error completing QR session:', error);
        return { data: false, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      console.error('Error in completeQRSession:', error);
      return { data: false, error: 'QRセッションの完了に失敗しました', success: false };
    }
  }

  // 店舗のQRセッション履歴を取得
  static async getStoreQRSessions(storeId: string): Promise<ApiResponse<QRSession[]>> {
    try {
      const { data, error } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching store QR sessions:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in getStoreQRSessions:', error);
      return { data: null, error: 'QRセッション履歴の取得に失敗しました', success: false };
    }
  }

  // セッションIDを生成
  private static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `qr_${timestamp}_${random}`;
  }
}
