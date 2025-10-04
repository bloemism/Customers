import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { CreditCard, Banknote, Check, AlertCircle, User, Loader } from 'lucide-react';
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
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentMethod: 'cash',
    customerId: '',
    finalAmount: 0
  });
  const [loading, setLoading] = useState(false);
  
  // 決済コード入力用の状態
  const [paymentCode, setPaymentCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'input' | 'payment' | 'complete'>('input');

  // 決済コードからデータを取得する関数
  const fetchPaymentByCode = async (code: string) => {
    if (!code || code.length !== 5) {
      setCodeError('5桁の数字を入力してください');
      return;
    }

    try {
      setCodeLoading(true);
      setCodeError('');
      console.log('決済コード取得開始:', code);

      const { data, error } = await supabase
        .from('payment_codes')
        .select('payment_data, expires_at, used_at')
        .eq('code', code)
        .single();

      if (error) {
        console.error('決済コード取得エラー:', error);
        setCodeError('決済コードが見つかりません');
        return;
      }

      if (!data) {
        setCodeError('決済コードが見つかりません');
        return;
      }

      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (now > expiresAt) {
        setCodeError('決済コードの有効期限が切れています');
        return;
      }

      if (data.used_at) {
        setCodeError('この決済コードは既に使用されています');
        return;
      }

      const paymentData = data.payment_data;
      console.log('取得した決済データ:', paymentData);

      setPaymentData({
        paymentMethod: 'credit',
        customerId: customerData?.id || '',
        qrStoreData: {
          storeId: paymentData.storeId,
          storeName: paymentData.storeName,
          items: paymentData.items,
          pointsUsed: paymentData.pointsUsed,
          totalAmount: paymentData.totalAmount,
          timestamp: paymentData.timestamp
        },
        finalAmount: paymentData.totalAmount
      });

      setStep('payment');
      console.log('決済データ設定完了');

    } catch (error) {
      console.error('決済コード取得エラー:', error);
      setCodeError('決済コードの取得に失敗しました');
    } finally {
      setCodeLoading(false);
    }
  };
  const scannerRef = useRef<HTMLDivElement>(null);
      setCodeError('5桁の数字を入力してください');
      return;
    }

    try {
      setCodeLoading(true);
      setCodeError('');
      console.log('決済コード取得開始:', code);

      const { data, error } = await supabase
        .from('payment_codes')
        .select('payment_data, expires_at, used_at')
        .eq('code', code)
        .single();

      if (error) {
        console.error('決済コード取得エラー:', error);
        setCodeError('決済コードが見つかりません');
        return;
      }

      if (!data) {
        setCodeError('決済コードが見つかりません');
        return;
      }

      // 期限チェック
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (now > expiresAt) {
        setCodeError('決済コードの有効期限が切れています');
        return;
      }

      // 使用済みチェック
      if (data.used_at) {
        setCodeError('この決済コードは既に使用されています');
        return;
      }

      // 決済データを設定
      const paymentData = data.payment_data;
      console.log('取得した決済データ:', paymentData);

      setPaymentData({
        paymentMethod: 'credit',
        customerId: customerData?.id || '',
        qrStoreData: {
          storeId: paymentData.storeId,
          storeName: paymentData.storeName,
          items: paymentData.items,
          pointsUsed: paymentData.pointsUsed,
          totalAmount: paymentData.totalAmount,
          timestamp: paymentData.timestamp
        },
        finalAmount: paymentData.totalAmount
      });

      setStep('payment');
      console.log('決済データ設定完了');

    } catch (error) {
      console.error('決済コード取得エラー:', error);
      setCodeError('決済コードの取得に失敗しました');
    } finally {
      setCodeLoading(false);
    }
  };

  useEffect(() => {
    if (showScanner) {
      // DOM要素のレンダリングを待ってから初期化
      setTimeout(() => {
        initializeScanner();
      }, 100);
    }
    return () => {
      if (scanner) {
        try {
          scanner.clear();
        } catch (e) {
          console.log('Scanner clear error in useEffect cleanup (ignored):', e);
        }
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
        try {
          scanner.clear();
        } catch (e) {
          console.log('Scanner clear error (ignored):', e);
        }
        setScanner(null);
      }

      // DOM要素が存在することを確認（少し待ってから確認）
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 複数の方法でDOM要素を取得
      let qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement && scannerRef.current) {
        qrReaderElement = scannerRef.current;
      }
      
      if (!qrReaderElement) {
        console.error('QR reader element not found after delay');
        console.log('Available elements:', {
          byId: document.getElementById("qr-reader"),
          byRef: scannerRef.current,
          showScanner: showScanner
        });
        setError('カメラの初期化に失敗しました');
        setCameraLoading(false);
        return;
      }

      console.log('QR reader element found, proceeding with scanner initialization');

      // カメラアクセス許可を確認（PC対応）
      try {
        // PCとモバイルの両方に対応
        const constraints = {
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        };

        // デバイス判定（簡易版）
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // モバイルの場合：背面カメラを優先
          try {
            const mobileStream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              } 
            });
            mobileStream.getTracks().forEach(track => track.stop());
            console.log('Mobile camera access confirmed');
          } catch (mobileError) {
            console.log('Mobile camera not available, trying default camera');
            const defaultStream = await navigator.mediaDevices.getUserMedia(constraints);
            defaultStream.getTracks().forEach(track => track.stop());
            console.log('Default camera access confirmed');
          }
        } else {
          // PCの場合：デフォルトカメラを直接使用
          const defaultStream = await navigator.mediaDevices.getUserMedia(constraints);
          defaultStream.getTracks().forEach(track => track.stop());
          console.log('PC camera access confirmed');
        }
      } catch (cameraError) {
        console.error('Camera access denied:', cameraError);
        setError('カメラへのアクセスが許可されていません。ブラウザの設定でカメラアクセスを許可してください。');
        setCameraLoading(false);
        return;
      }

      console.log('Creating Html5QrcodeScanner...');
      
      // デバイス判定（簡易版）
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const newScanner = new Html5QrcodeScanner(
        qrReaderElement.id || "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // PC対応：デバイスに応じた設定
          showTorchButtonIfSupported: isMobile,
          showZoomSliderIfSupported: isMobile,
          useBarCodeDetectorIfSupported: false,
          // PC対応：カメラ制約を削除
          videoConstraints: isMobile ? {
            facingMode: "environment"
          } : undefined
        },
        false
      );

      console.log('Scanner created, calling render...');
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

      console.log('Scanner render completed');
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
      console.log('QRコード読み取り結果:', decodedText);
      const qrData = JSON.parse(decodedText);
      console.log('パースされたQRデータ:', qrData);
      
      // 決済用QRコード形式をチェック（type, storeId, items, totalAmount）
      if (qrData.type !== 'payment' || !qrData.storeId || !qrData.items || !qrData.totalAmount) {
        console.error('無効なQRコード形式:', qrData);
        setError('無効なQRコードです。店舗側で生成された決済用QRコードを読み取ってください。');
        return;
      }

      console.log('有効な決済QRコードを検出:', {
        storeName: qrData.storeName,
        itemsCount: qrData.items.length,
        total: qrData.totalAmount
      });

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
        
        // QRコードデータを保存（新しい決済用データ構造）
        const qrStoreData: QRStoreData = {
          storeId: qrData.storeId,
          storeName: qrData.storeName,
          items: qrData.items,
          pointsUsed: qrData.pointsUsed || 0,
          totalAmount: qrData.totalAmount,
          timestamp: qrData.timestamp || new Date().toISOString()
        };

        console.log('変換されたQRStoreData:', qrStoreData);

        const finalAmount = qrData.totalAmount - (qrData.pointsUsed || 0);
        console.log('最終決済金額計算:', {
          totalAmount: qrData.totalAmount,
          pointsUsed: qrData.pointsUsed,
          finalAmount: finalAmount
        });

        setPaymentData(prev => ({
          ...prev,
          customerId: customerData.id,
          qrStoreData: qrStoreData,
          finalAmount: finalAmount
        }));

        console.log('PaymentData更新完了');
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

  const stopCamera = async () => {
    try {
      if (scanner) {
        console.log('Stopping camera and clearing scanner...');
        await scanner.clear();
        setScanner(null);
        console.log('Scanner cleared successfully');
      }
      setShowScanner(false);
      setCameraLoading(false);
      setError('');
    } catch (error) {
      console.error('Error stopping camera:', error);
      // エラーが発生しても状態はリセット
      setShowScanner(false);
      setCameraLoading(false);
      setError('');
    }
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
          {/* 決済コード入力 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center mb-4">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">🔢</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">決済コード入力</h3>
              <p className="text-sm text-gray-600">店舗から伝えられた5桁のコードを入力</p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={paymentCode}
                  onChange={(e) => setPaymentCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="12345"
                  className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={5}
                />
              </div>

              <button
                onClick={() => fetchPaymentByCode(paymentCode)}
                disabled={codeLoading || paymentCode.length !== 5}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {codeLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    確認中...
                  </>
                ) : (
                  '決済データを取得'
                )}
              </button>

              {codeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <p className="text-red-600 text-sm">{codeError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* または */}
          <div className="text-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">または</span>
              </div>
            </div>
          </div>

          {/* QRコードスキャン */}
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
                  {/* QR reader要素は常にレンダリング */}
                  <div id="qr-reader" ref={scannerRef} className="max-w-md mx-auto mb-4"></div>
                  
                  {cameraLoading && (
                    <div className="flex flex-col items-center space-y-4 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600">カメラを起動中...</p>
                    </div>
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
          <div className="space-y-6">
            {/* 店舗データ（QRコードから読み取り） */}
            {paymentData.qrStoreData && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">店舗データ</h3>
                </div>
                
                {/* 店舗情報 */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">店舗情報</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>店舗名:</strong> {paymentData.qrStoreData.storeName}</p>
                    <p><strong>店舗ID:</strong> {paymentData.qrStoreData.storeId}</p>
                    <p><strong>読み取り時刻:</strong> {new Date(paymentData.qrStoreData.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                {/* エラーメッセージ */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* デバッグ情報 */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-yellow-800 mb-2">デバッグ情報</h4>
                    <div className="text-xs text-yellow-700 space-y-1">
                      <p>QRStoreData: {JSON.stringify(paymentData.qrStoreData, null, 2)}</p>
                      <p>Final Amount: ¥{paymentData.finalAmount}</p>
                      <p>Customer Data: {customerData ? 'Loaded' : 'Not loaded'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 決済データ */}
            {paymentData.qrStoreData && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">決済データ</h3>
                </div>

              {/* 商品合計 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">購入商品</h4>
                {paymentData.qrStoreData?.items && paymentData.qrStoreData.items.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {paymentData.qrStoreData.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span>¥{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span>小計</span>
                        <span>¥{paymentData.qrStoreData.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">商品データがありません</p>
                )}
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
                <div className="space-y-2">
                  {paymentData.qrStoreData && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">商品合計</span>
                        <span className="text-lg font-medium text-blue-700">
                          ¥{paymentData.qrStoreData.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      {paymentData.qrStoreData.pointsUsed > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">使用ポイント</span>
                          <span className="text-lg font-medium text-blue-700">
                            -¥{paymentData.qrStoreData.pointsUsed.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2">
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
            )}

            {/* 顧客情報 */}
            {customerData && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 rounded-full p-2 mr-3">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">顧客情報</h3>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-purple-900 mb-2">基本情報</h4>
                      <div className="text-sm text-purple-800 space-y-1">
                        <p><strong>名前:</strong> {customerData.name || '未設定'}</p>
                        <p><strong>メール:</strong> {customerData.email}</p>
                        <p><strong>電話:</strong> {customerData.phone || '未設定'}</p>
                        <p><strong>レベル:</strong> {customerData.level}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-900 mb-2">ポイント情報</h4>
                      <div className="text-sm text-purple-800 space-y-1">
                        <p><strong>現在のポイント:</strong> {customerData.points.toLocaleString()}pt</p>
                        {paymentData.qrStoreData && (
                          <p><strong>獲得予定ポイント:</strong> +{calculatePoints(paymentData.qrStoreData.totalAmount)}pt</p>
                        )}
                        {paymentData.qrStoreData && (
                          <p><strong>決済後ポイント:</strong> {((customerData.points || 0) + calculatePoints(paymentData.qrStoreData.totalAmount)).toLocaleString()}pt</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 決済ボタン */}
            {paymentData.qrStoreData && customerData && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">決済を実行</h3>
                    <p className="text-gray-600 text-sm">最終確認後、決済を実行してください</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-green-800">最終決済金額</span>
                      <span className="text-3xl font-bold text-green-800">
                        ¥{paymentData.finalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
