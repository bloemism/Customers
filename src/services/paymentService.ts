import { loadStripe } from '@stripe/stripe-js';
import type { PaymentIntent, ApiResponse } from '../types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export class PaymentService {
  // 決済セッションを作成
  static async createPaymentSession(amount: number, currency: string = 'jpy'): Promise<ApiResponse<PaymentIntent>> {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済セッションの作成に失敗しました');
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error creating payment session:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : '決済セッションの作成に失敗しました', 
        success: false 
      };
    }
  }

  // QRコード用の決済セッションを作成
  static async createQRPaymentSession(amount: number): Promise<ApiResponse<{ qr_code: string; session_id: string }>> {
    try {
      const response = await fetch('/api/create-qr-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'jpy',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'QR決済セッションの作成に失敗しました');
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error creating QR payment session:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'QR決済セッションの作成に失敗しました', 
        success: false 
      };
    }
  }

  // 決済を確認
  static async confirmPayment(paymentIntentId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済の確認に失敗しました');
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { 
        data: false, 
        error: error instanceof Error ? error.message : '決済の確認に失敗しました', 
        success: false 
      };
    }
  }

  // Stripeインスタンスを取得
  static async getStripe() {
    return await stripePromise;
  }
}
