import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { ArrowLeft, CreditCard, Store, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentData {
  storeId?: string;
  amount?: number;
  description?: string;
  customerId?: string;
  qrData?: string;
  storeName?: string;
  customerName?: string;
  customerEmail?: string;
  timestamp?: string;
}

interface PaymentConfirmationData {
  paymentData: PaymentData;
  fromConfirmation: boolean;
}

export const StorePayment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer } = useCustomerAuth();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (location.state) {
      const state = location.state as PaymentData | PaymentConfirmationData;
      if ('fromConfirmation' in state && state.fromConfirmation) {
        // 決済確認ページからの遷移
        setPaymentData(state.paymentData);
      } else {
        // 直接の遷移
        setPaymentData(state as PaymentData);
      }
    } else {
      // デフォルトの決済データ（テスト用）
      setPaymentData({
        storeId: 'store_001',
        storeName: 'サンプル店舗',
        amount: 1000,
        description: '店舗決済',
        customerId: customer?.id || 'guest',
        customerName: customer?.name || 'ゲスト',
        customerEmail: customer?.email || 'guest@example.com'
      });
    }
  }, [location.state, customer]);

  const handlePayment = async () => {
    if (!paymentData) return;

    setIsProcessing(true);
    setPaymentStatus('idle');
    setErrorMessage('');

    try {
      // Stripe決済処理をシミュレート
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 実際のStripe決済処理はここで実装
      // const stripe = await loadStripe('your_stripe_publishable_key');
      // const { error } = await stripe.redirectToCheckout({
      //   lineItems: [{
      //     price: 'price_id',
      //     quantity: 1,
      //   }],
      //   mode: 'payment',
      //   successUrl: `${window.location.origin}/payment-success`,
      //   cancelUrl: `${window.location.origin}/payment-cancel`,
      // });

      // シミュレーション成功
      setPaymentStatus('success');
      
      // 3秒後にメニューに戻る
      setTimeout(() => {
        navigate('/customer-menu');
      }, 3000);

    } catch (error) {
      console.error('決済エラー:', error);
      setPaymentStatus('error');
      setErrorMessage('決済処理中にエラーが発生しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">決済情報が見つかりません</h2>
          <p className="text-gray-600 mb-4">QRコードを再度読み取ってください。</p>
          <button
            onClick={() => navigate('/customer-menu')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/customer-menu')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>戻る</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">店舗決済</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 決済情報カード */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">決済情報</h2>
              <p className="text-sm text-gray-600">店舗でのお支払い</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 金額表示 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">支払い金額</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatAmount(paymentData.amount || 0)}
                </span>
              </div>
            </div>

            {/* 店舗情報 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">店舗名</span>
                <span className="text-sm font-medium text-gray-900">{paymentData.storeName || '未設定'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">店舗ID</span>
                <span className="text-sm font-medium text-gray-900">{paymentData.storeId}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">説明</span>
                <span className="text-sm font-medium text-gray-900">{paymentData.description}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 決済ボタン */}
        <div className="space-y-4">
          {paymentStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">決済が完了しました</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                メニュー画面に自動的に戻ります...
              </p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">決済エラー</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={isProcessing || paymentStatus === 'success'}
            className="w-full bg-blue-500 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>処理中...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>決済を実行</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            ※ 決済はStripeを通じて安全に処理されます
          </p>
        </div>

        {/* 顧客情報 */}
        <div className="mt-6 bg-white rounded-lg p-4 border">
          <h3 className="text-sm font-medium text-gray-900 mb-2">決済者情報</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>名前: {paymentData.customerName || customer?.name || '未設定'}</p>
            <p>メール: {paymentData.customerEmail || customer?.email || '未設定'}</p>
            <p>ポイント: {customer?.points || 0}pt</p>
          </div>
        </div>
      </div>
    </div>
  );
};