import React, { useState, useEffect, useRef } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { QrCode, CreditCard, Banknote, Check, X, AlertCircle, User, Mail, Star, Loader } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getStripe, createPaymentIntent, confirmPayment } from '../services/stripeService';

interface CustomerData {
  id: string;
  email: string;
  name: string;
  points: number;
  level: 'BASIC' | 'REGULAR' | 'PRO' | 'EXPERT';
  phone?: string;
}

interface PaymentData {
  amount: number;
  paymentMethod: 'cash' | 'credit';
  customerId: string;
  storeId: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

const levelConfig = {
  BASIC: { name: 'ベーシック', color: 'bg-gray-100 text-gray-800' },
  REGULAR: { name: 'レギュラー', color: 'bg-blue-100 text-blue-800' },
  PRO: { name: 'プロ', color: 'bg-purple-100 text-purple-800' },
  EXPERT: { name: 'エキスパート', color: 'bg-yellow-100 text-yellow-800' }
};

export const StorePayment: React.FC = () => {
  const { user } = useSimpleAuth();
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 0,
    paymentMethod: 'cash',
    customerId: '',
    storeId: user?.id || '',
    items: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showScanner && scannerRef.current) {
      initializeScanner();
    }
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [showScanner]);

  const initializeScanner = () => {
    if (scanner) {
      scanner.clear();
    }

    const newScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedFormats: [Html5QrcodeSupportedFormats.QR_CODE]
      },
      false
    );

    newScanner.render(
      (decodedText) => {
        handleQRCodeScanned(decodedText);
      },
      (error) => {
        // エラーは無視（連続スキャン時のエラー）
      }
    );

    setScanner(newScanner);
  };

  const handleQRCodeScanned = async (decodedText: string) => {
    try {
      const qrData = JSON.parse(decodedText);
      
      if (!qrData.customerId) {
        setError('無効なQRコードです');
        return;
      }

      // 顧客データを取得
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', qrData.customerId)
        .single();

      if (error || !data) {
        setError('顧客データが見つかりません');
        return;
      }

      setCustomerData(data);
      setPaymentData(prev => ({
        ...prev,
        customerId: qrData.customerId
      }));
      setShowScanner(false);
      if (scanner) {
        scanner.clear();
      }
    } catch (error) {
      setError('QRコードの読み取りに失敗しました');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    setPaymentData(prev => ({
      ...prev,
      amount
    }));
  };

  const handlePaymentMethodChange = (method: 'cash' | 'credit') => {
    setPaymentData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  const calculatePoints = (amount: number) => {
    return Math.floor(amount * 0.05); // 5%のポイント還元
  };

  const processPayment = async () => {
    if (!customerData || paymentData.amount <= 0) {
      setError('金額を入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (paymentData.paymentMethod === 'cash') {
        // 現金決済の場合
        await processCashPayment();
      } else {
        // クレジット決済の場合
        await processCreditPayment();
      }
    } catch (error: any) {
      console.error('決済エラー:', error);
      setError(error.message || '決済に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const processCashPayment = async () => {
    const pointsEarned = calculatePoints(paymentData.amount);
    const newPoints = customerData!.points + pointsEarned;

    // 顧客のポイントを更新
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerData!.id);

    if (updateError) {
      throw updateError;
    }

    // 購入履歴を記録
    await recordPurchaseHistory(pointsEarned);
    setSuccess(true);
  };

  const processCreditPayment = async () => {
    try {
      // Payment Intent作成
      const { clientSecret } = await createPaymentIntent(
        paymentData.amount,
        paymentData.storeId,
        customerData!.id
      );

      // Stripe決済フォーム表示
      const stripe = await getStripe();
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        const pointsEarned = calculatePoints(paymentData.amount);
        await recordPurchaseHistory(pointsEarned);
        setSuccess(true);
      } else {
        throw new Error('決済が完了しませんでした');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const recordPurchaseHistory = async (pointsEarned: number) => {
    const { error: historyError } = await supabase
      .from('purchase_history')
      .insert({
        customer_id: customerData!.id,
        store_id: paymentData.storeId,
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        points_earned: pointsEarned,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('購入履歴保存エラー:', historyError);
    }
  };

  const resetPayment = () => {
    setCustomerData(null);
    setPaymentData({
      amount: 0,
      paymentMethod: 'cash',
      customerId: '',
      storeId: user?.id || '',
      items: []
    });
    setError('');
    setSuccess(false);
    setShowScanner(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">決済完了！</h2>
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">決済金額</p>
              <p className="text-2xl font-bold text-gray-900">¥{paymentData.amount.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-500">獲得ポイント</p>
              <p className="text-xl font-bold text-blue-800">+{calculatePoints(paymentData.amount)}pt</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-500">新しいポイント残高</p>
              <p className="text-xl font-bold text-green-800">{(customerData?.points || 0) + calculatePoints(paymentData.amount)}pt</p>
            </div>
          </div>
          <button
            onClick={resetPayment}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            新しい決済を開始
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">店舗決済システム</h1>
            <div className="flex items-center space-x-2">
              <QrCode className="h-6 w-6 text-blue-600" />
              <span className="text-sm text-gray-600">QR決済</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QRスキャナー */}
          {showScanner && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">顧客QRコードをスキャン</h2>
              <div id="qr-reader" ref={scannerRef}></div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                顧客のQRコードをカメラにかざしてください
              </p>
            </div>
          )}

          {/* 顧客情報と決済フォーム */}
          {customerData && (
            <div className="space-y-6">
              {/* 顧客情報 */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">顧客情報</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">お名前</p>
                      <p className="font-medium text-gray-900">{customerData.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">メールアドレス</p>
                      <p className="font-medium text-gray-900">{customerData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">レベル</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelConfig[customerData.level].color}`}>
                        {levelConfig[customerData.level].name}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-500">現在のポイント</p>
                    <p className="text-2xl font-bold text-blue-800">{customerData.points.toLocaleString()}pt</p>
                  </div>
                </div>
              </div>

              {/* 決済フォーム */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">決済情報</h2>
                
                {/* エラーメッセージ */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* 金額入力 */}
                <div className="mb-6">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    決済金額
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      id="amount"
                      value={paymentData.amount || ''}
                      onChange={handleAmountChange}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>

                {/* 決済方法 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    決済方法
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handlePaymentMethodChange('cash')}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        paymentData.paymentMethod === 'cash'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Banknote className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="font-medium text-gray-900">現金</p>
                    </button>
                    <button
                      onClick={() => handlePaymentMethodChange('credit')}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        paymentData.paymentMethod === 'credit'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="font-medium text-gray-900">クレジット</p>
                    </button>
                  </div>
                </div>

                {/* ポイント計算 */}
                {paymentData.amount > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">獲得ポイント</span>
                      <span className="text-lg font-bold text-blue-600">
                        +{calculatePoints(paymentData.amount)}pt
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">新しいポイント残高</span>
                      <span className="text-lg font-bold text-green-600">
                        {(customerData.points + calculatePoints(paymentData.amount)).toLocaleString()}pt
                      </span>
                    </div>
                  </div>
                )}

                {/* 決済ボタン */}
                <div className="flex space-x-4">
                  <button
                    onClick={resetPayment}
                    className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={processPayment}
                    disabled={loading || paymentData.amount <= 0}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        処理中...
                      </div>
                    ) : (
                      '決済実行'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
