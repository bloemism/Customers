import React, { useState } from 'react';
import { SimpleStripeService } from '../services/simpleStripeService';
import { TEST_STRIPE_PRICE_ID, STRIPE_PRODUCT_INFO } from '../lib/stripe';

const StripeTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTestCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log('Stripeテスト開始');
      console.log('使用する商品ID:', TEST_STRIPE_PRICE_ID);
      
      await SimpleStripeService.createSubscription('test@example.com');
      
      console.log('Stripe Checkout成功');
      setSuccess('Stripe Checkoutが正常に開始されました');
    } catch (err) {
      console.error('Stripeテストエラー:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSubscriptionStatus = async () => {
    try {
      setWebhookLoading(true);
      setError(null);
      setSuccess(null);

      const status = await SimpleStripeService.getSubscriptionStatus('test@example.com');
      console.log('サブスクリプション状態:', status);

      setSuccess('サブスクリプション状態の取得が完了しました');
    } catch (err) {
      console.error('サブスクリプション状態取得エラー:', err);
      setError(err instanceof Error ? err.message : 'サブスクリプション状態取得でエラーが発生しました');
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Stripe テスト
        </h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">テスト情報</h2>
            <p className="text-sm text-blue-700">
              商品名: {STRIPE_PRODUCT_INFO.name}
            </p>
            <p className="text-sm text-blue-700">
              価格ID: {STRIPE_PRODUCT_INFO.priceId}
            </p>
            <p className="text-sm text-blue-700">
              商品ID: {STRIPE_PRODUCT_INFO.productId}
            </p>
            <p className="text-sm text-blue-700">
              価格: ¥{STRIPE_PRODUCT_INFO.price.toLocaleString()}/月
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}
          
          <button
            onClick={handleTestCheckout}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '処理中...' : 'Stripe Checkout テスト'}
          </button>

          <button
            onClick={handleTestSubscriptionStatus}
            disabled={webhookLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {webhookLoading ? '処理中...' : 'サブスクリプション状態取得テスト'}
          </button>
          
          <div className="text-xs text-gray-500 mt-4">
            <p>※ このテストでは実際の決済は発生しません</p>
            <p>※ テスト用カード: 4242 4242 4242 4242</p>
            <p>※ データベースエラーは無視され、ダミーデータが返されます</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeTest;
