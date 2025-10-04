import React, { useState, useEffect, useRef } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { QrCode, CreditCard, Banknote, Check, AlertCircle, User, Mail, Loader } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getStripe, createPaymentIntent } from '../services/stripeService';

interface CustomerData {
  id: string;
  email: string;
  name: string;
  points: number;
  level: 'BASIC' | 'REGULAR' | 'PRO' | 'EXPERT';
  phone?: string;
}


interface QRStoreData {
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
}

interface PaymentData {
  paymentMethod: 'cash' | 'credit';
  customerId: string;
  qrStoreData?: QRStoreData;
  finalAmount: number;
}


export const StorePayment: React.FC = () => {
  const { user } = useSimpleAuth();
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentMethod: 'cash',
    customerId: '',
    finalAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [step, setStep] = useState<'scan' | 'payment' | 'complete'>('scan');
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showScanner && scannerRef.current) {
      // 少し遅延させてから初期化（DOM要素が確実に存在することを保証）
      setTimeout(() => {
        initializeScanner();
      }, 100);
    }
    return () => {
      if (scanner) {
        scanner.clear();
        setScanner(null);
      }
    };
  }, [showScanner]);

  const initializeScanner = async () => {
    try {
      setCameraLoading(true);
      setError('');

      // 既存のスキャナーをクリア
      if (scanner) {
        scanner.clear();
        setScanner(null);
      }

      // DOM要素が存在することを確認
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        console.error('QR reader element not found');
        setError('カメラの初期化に失敗しました');
        setCameraLoading(false);
        return;
      }

      // カメラアクセス許可を確認
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (cameraError) {
        console.error('Camera access denied:', cameraError);
        setError('カメラへのアクセスが許可されていません。ブラウザの設定でカメラアクセスを許可してください。');
        setCameraLoading(false);
        return;
      }

      const newScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      newScanner.render(
        (decodedText) => {
          console.log('QR Code detected:', decodedText);
          handleQRCodeScanned(decodedText);
        },
        (error) => {
          // エラーログを出力（デバッグ用）
          if (error && !error.includes('No QR code found')) {
            console.error('QR Scanner error:', error);
          }
        }
      );

      setScanner(newScanner);
      setCameraLoading(false);
      setError(''); // エラーをクリア
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setError('カメラの初期化に失敗しました: ' + (error as Error).message);
      setCameraLoading(false);
    }
  };

  const handleQRCodeScanned = async (decodedText: string) => {
    try {
      const qrData = JSON.parse(decodedText);
      
      // 店舗QRコードの形式をチェック
      if (!qrData.storeId || !qrData.items || !qrData.totalAmount) {
        setError('無効な店舗QRコードです');
        return;
      }

      // 顧客データを取得（現在ログイン中のユーザー）
      if (user?.id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (customerError || !customerData) {
          setError('顧客データが見つかりません');
          return;
        }

        setCustomerData(customerData);
        
        // QRコードデータを保存
        const qrStoreData: QRStoreData = {
          storeId: qrData.storeId,
          storeName: qrData.storeName || '店舗',
          items: qrData.items,
          pointsUsed: qrData.pointsUsed || 0,
          totalAmount: qrData.totalAmount,
          timestamp: qrData.timestamp || new Date().toISOString()
        };

        setPaymentData(prev => ({
          ...prev,
          customerId: customerData.id,
          qrStoreData: qrStoreData,
          finalAmount: qrData.totalAmount - (qrData.pointsUsed || 0)
        }));
      }

      setShowScanner(false);
      setStep('payment');
      if (scanner) {
        scanner.clear();
      }
    } catch (error) {
      setError('QRコードの読み取りに失敗しました');
    }
  };

  const startCamera = async () => {
    setError('');
    setShowScanner(true);
  };

  const stopCamera = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setShowScanner(false);
    setCameraLoading(false);
    setError('');
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
    if (!customerData || !paymentData.qrStoreData || paymentData.finalAmount <= 0) {
      setError('決済情報が不正です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (paymentData.paymentMethod === 'cash') {
        // 現金決済の場合
        await processCashPayment();
      } else {
        // ストライプ決済の場合
        await processStripePayment();
      }
    } catch (error: any) {
      console.error('決済エラー:', error);
      setError(error.message || '決済に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const processCashPayment = async () => {
    const pointsEarned = calculatePoints(paymentData.qrStoreData!.totalAmount);
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
    setStep('complete');
    setSuccess(true);
  };

  const processStripePayment = async () => {
    try {
      // Payment Intent作成
      const { clientSecret } = await createPaymentIntent(
        paymentData.finalAmount,
        paymentData.qrStoreData!.storeId,
        customerData!.id
      );

      // Stripe決済フォーム表示
      const stripe = await getStripe();
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        const pointsEarned = calculatePoints(paymentData.qrStoreData!.totalAmount);
        await recordPurchaseHistory(pointsEarned);
        setStep('complete');
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
        store_id: paymentData.qrStoreData!.storeId,
        amount: paymentData.qrStoreData!.totalAmount,
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
      paymentMethod: 'cash',
      customerId: '',
      finalAmount: 0
    });
    setError('');
    setSuccess(false);
    setShowScanner(false);
    setStep('scan');
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
              <p className="text-2xl font-bold text-gray-900">¥{paymentData.qrStoreData?.totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-500">獲得ポイント</p>
              <p className="text-xl font-bold text-blue-800">+{calculatePoints(paymentData.qrStoreData?.totalAmount || 0)}pt</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-500">新しいポイント残高</p>
              <p className="text-xl font-bold text-green-800">{(customerData?.points || 0) + calculatePoints(paymentData.qrStoreData?.totalAmount || 0)}pt</p>
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">店舗決済システム</h1>
            <div className="flex items-center space-x-2">
              <QrCode className="h-6 w-6 text-blue-600" />
              <span className="text-sm text-gray-600">QR決済</span>
            </div>
          </div>
        </div>

        {/* QRスキャナー */}
        {step === 'scan' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">店舗QRコードをスキャン</h2>
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-block bg-blue-100 rounded-full p-4 mb-4">
                  <QrCode className="h-12 w-12 text-blue-600" />
                </div>
                <p className="text-gray-600 mb-4">
                  店舗で表示されたQRコードをスキャンしてください
                </p>
                <p className="text-sm text-gray-500">
                  QRコードには商品情報、価格、使用ポイントが含まれています
                </p>
              </div>
              
              {!showScanner ? (
                <div className="space-y-4">
                  <button
                    onClick={startCamera}
                    disabled={cameraLoading}
                    className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cameraLoading ? 'カメラを起動中...' : 'カメラを起動'}
                  </button>
                  <div className="text-xs text-gray-500">
                    <p>• 初回はカメラアクセスの許可が必要です</p>
                    <p>• ブラウザの設定でカメラがブロックされている場合は許可してください</p>
                  </div>
                </div>
              ) : (
                <div>
                  {cameraLoading ? (
                    <div className="flex flex-col items-center space-y-4 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600">カメラを起動中...</p>
                    </div>
                  ) : (
                    <div id="qr-reader" ref={scannerRef} className="max-w-md mx-auto mb-4"></div>
                  )}
                  <button
                    onClick={stopCamera}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    カメラを停止
                  </button>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* 決済画面 */}
        {step === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 決済情報 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">決済情報</h3>
                
              {/* エラーメッセージ */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* 商品合計 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">購入商品</h4>
                <div className="space-y-2">
                  {paymentData.qrStoreData?.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>¥{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>小計</span>
                    <span>¥{paymentData.qrStoreData?.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 使用ポイント表示 */}
              {paymentData.qrStoreData && paymentData.qrStoreData.pointsUsed > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600">使用ポイント</span>
                    <span className="text-lg font-bold text-blue-600">
                      -{paymentData.qrStoreData.pointsUsed}pt
                    </span>
                  </div>
                </div>
              )}

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
                    <p className="font-medium text-gray-900">ストライプ決済</p>
                  </button>
                </div>
              </div>

              {/* 最終金額 */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="border-t border-blue-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-blue-800">最終決済金額</span>
                    <span className="text-2xl font-bold text-blue-800">
                      ¥{paymentData.finalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 獲得ポイント */}
              {paymentData.qrStoreData && paymentData.qrStoreData.totalAmount > 0 && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-green-600">獲得ポイント</span>
                    <span className="text-lg font-bold text-green-600">
                      +{calculatePoints(paymentData.qrStoreData.totalAmount)}pt
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">新しいポイント残高</span>
                    <span className="text-lg font-bold text-green-600">
                      {((customerData?.points || 0) + calculatePoints(paymentData.qrStoreData.totalAmount)).toLocaleString()}pt
                    </span>
                  </div>
                </div>
              )}

              {/* 決済ボタン */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('scan')}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  戻る
                </button>
                <button
                  onClick={processPayment}
                  disabled={loading || paymentData.finalAmount <= 0}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      処理中...
                    </div>
                  ) : (
                    paymentData.paymentMethod === 'cash' ? '現金決済実行' : 'ストライプ決済実行'
                  )}
                </button>
              </div>
            </div>

            {/* 顧客・店舗情報 */}
            <div className="space-y-6">
              {/* 顧客情報 */}
              {customerData && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">顧客情報</h3>
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

                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-500">現在のポイント</p>
                      <p className="text-2xl font-bold text-blue-800">{customerData.points.toLocaleString()}pt</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 店舗情報 */}
              {paymentData.qrStoreData && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">店舗情報</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">店舗名</p>
                      <p className="font-medium text-gray-900">{paymentData.qrStoreData.storeName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">店舗ID</p>
                      <p className="font-medium text-gray-900">{paymentData.qrStoreData.storeId}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">発行日時</p>
                      <p className="font-medium text-gray-900">
                        {new Date(paymentData.qrStoreData.timestamp).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
