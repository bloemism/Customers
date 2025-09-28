import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { ArrowLeft, Store, DollarSign, User, CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface StoreData {
  type: 'store_payment';
  storeId: string;
  storeName: string;
  amount: number;
  description: string;
  timestamp: number;
  signature?: string;
}

interface PaymentConfirmationProps {
  storeData?: StoreData;
  timestamp?: string;
}

export const PaymentConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer } = useCustomerAuth();
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (location.state?.storeData) {
      setStoreData(location.state.storeData);
    } else {
      // デフォルトのテストデータ
      setStoreData({
        type: 'store_payment',
        storeId: 'store_001',
        storeName: 'サンプル花屋',
        amount: 1500,
        description: '花束の購入',
        timestamp: Date.now()
      });
    }
  }, [location.state]);

  const handlePayment = async () => {
    if (!storeData || !customer) return;

    setIsProcessing(true);
    setPaymentStatus('idle');
    setErrorMessage('');

    try {
      // 決済データを準備
      const paymentData = {
        storeId: storeData.storeId,
        storeName: storeData.storeName,
        amount: storeData.amount,
        description: storeData.description,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        timestamp: new Date().toISOString()
      };

      // Stripe決済ページに遷移
      navigate('/store-payment', {
        state: {
          paymentData,
          fromConfirmation: true
        }
      });

    } catch (error) {
      console.error('決済準備エラー:', error);
      setPaymentStatus('error');
      setErrorMessage('決済の準備中にエラーが発生しました。');
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

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!storeData) {
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
            <h1 className="text-xl font-semibold text-gray-900">決済確認</h1>
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">支払い金額</p>
                    <p className="text-3xl font-bold text-gray-900">{formatAmount(storeData.amount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 店舗情報 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">店舗情報</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">店舗名</span>
                  <span className="text-sm font-medium text-gray-900">{storeData.storeName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">店舗ID</span>
                  <span className="text-sm font-medium text-gray-900">{storeData.storeId}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">商品・サービス</span>
                  <span className="text-sm font-medium text-gray-900">{storeData.description}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">QRコード生成時刻</span>
                  <span className="text-sm font-medium text-gray-900">{formatTimestamp(storeData.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 顧客情報 */}
        {customer && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">決済者情報</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">お名前</span>
                <span className="text-sm font-medium text-gray-900">{customer.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">メールアドレス</span>
                <span className="text-sm font-medium text-gray-900">{customer.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">現在のポイント</span>
                <span className="text-sm font-medium text-gray-900">{customer.points || 0}pt</span>
              </div>
            </div>
          </div>
        )}

        {/* 決済ボタン */}
        <div className="space-y-4">
          {paymentStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">エラー</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-blue-500 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>準備中...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>決済を実行</span>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              ※ 決済はStripeを通じて安全に処理されます
            </p>
            <p className="text-xs text-gray-400 mt-1">
              QRコードの有効期限: 5分
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
