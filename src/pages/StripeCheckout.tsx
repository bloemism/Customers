import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, User, Building, ShoppingCart, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentSessionData {
  customerData: {
    id: string;
    email: string;
    name: string;
    points: number;
    level: string;
    phone?: string;
  };
  storeData: {
    storeId: string;
    storeName: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    pointsUsed: number;
    totalAmount: number;
    timestamp: string;
  };
  finalAmount: number;
  paymentCode: string;
  timestamp: string;
}

export const StripeCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentData, setPaymentData] = useState<PaymentSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // URLパラメータから決済情報を取得
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const amount = urlParams.get('amount');
    const storeId = urlParams.get('store');
    const customerId = urlParams.get('customer');

    // ローカルストレージから決済データを取得
    const storedData = localStorage.getItem('payment_session');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as PaymentSessionData;
        setPaymentData(parsedData);
      } catch (error) {
        console.error('決済データの解析エラー:', error);
        setError('決済データの読み込みに失敗しました');
      }
    } else {
      setError('決済データが見つかりません。最初からやり直してください。');
    }
  }, [location.search]);

  // Stripe決済処理（直接Checkout URLにリダイレクト）
  const handleStripePayment = async () => {
    if (!paymentData) return;

    setLoading(true);
    setError('');

    try {
      // 決済データをURLパラメータとして渡す
      const checkoutUrl = new URL('https://buy.stripe.com/test_bJedRbbhY832ez8cGtgnK02');
      
      // 決済情報をクエリパラメータとして追加
      checkoutUrl.searchParams.set('prefilled_email', paymentData.customerData.email);
      checkoutUrl.searchParams.set('client_reference_id', paymentData.paymentCode);
      
      // カスタムフィールドとして決済情報を追加
      checkoutUrl.searchParams.set('customer_name', paymentData.customerData.name);
      checkoutUrl.searchParams.set('store_name', paymentData.storeData.storeName);
      checkoutUrl.searchParams.set('amount', paymentData.finalAmount.toString());

      // Stripe Checkoutページにリダイレクト
      window.location.href = checkoutUrl.toString();

    } catch (error) {
      console.error('Stripe決済エラー:', error);
      setError(error instanceof Error ? error.message : '決済に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 決済完了後の処理
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const payment_intent = urlParams.get('payment_intent');
    const payment_intent_client_secret = urlParams.get('payment_intent_client_secret');

    if (payment_intent && payment_intent_client_secret) {
      // 決済完了
      setSuccess(true);
      // ローカルストレージをクリア
      localStorage.removeItem('payment_session');
    }
  }, [location.search]);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">決済完了</h1>
            <p className="text-gray-600">決済が正常に完了しました</p>
          </div>
          
          <button
            onClick={() => navigate('/customer-menu')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">エラー</h1>
            <p className="text-gray-600">{error || '決済データが見つかりません'}</p>
          </div>
          
          <button
            onClick={() => navigate('/customer-menu')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/store-payment')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Stripe決済</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* 決済情報 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">決済情報</h2>
          </div>
          
          <div className="space-y-4">
            {/* 店舗情報 */}
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Building className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-900">{paymentData.storeData.storeName}</p>
                <p className="text-sm text-blue-700">店舗</p>
              </div>
            </div>

            {/* 顧客情報 */}
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <User className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-900">{paymentData.customerData.name}</p>
                <p className="text-sm text-green-700">{paymentData.customerData.email}</p>
              </div>
            </div>

            {/* 商品情報 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-3">
                <ShoppingCart className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="font-medium text-gray-900">購入商品</h3>
              </div>
              
              <div className="space-y-2">
                {paymentData.storeData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-900">¥{item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 mt-3 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">合計金額</span>
                  <span className="text-xl font-bold text-gray-900">¥{paymentData.finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 決済コード */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-purple-600 mb-1">決済コード</p>
                <p className="text-2xl font-mono font-bold text-purple-900">{paymentData.paymentCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 決済ボタン */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <button
            onClick={handleStripePayment}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                処理中...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Stripeで決済する
              </>
            )}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            安全なStripe決済システムを使用します
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
