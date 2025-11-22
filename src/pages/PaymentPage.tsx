import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Camera, CreditCard, AlertCircle, Hash } from 'lucide-react';
import { CustomerStripeService, type PaymentData } from '../services/customerStripeService';
import { useCustomer } from '../contexts/CustomerContext';
import { supabase } from '../lib/supabase';

const PaymentPage: React.FC = () => {
  console.log('🔵 PaymentPage コンポーネント開始');
  const navigate = useNavigate();
  const { customer, loading: customerLoading, error: customerError } = useCustomer();
  
  console.log('🔵 CustomerContext取得成功:', { 
    customerLoading, 
    hasCustomer: !!customer, 
    error: customerError,
    pathname: window.location.pathname 
  });
  
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // デバッグ用ログ
  React.useEffect(() => {
    console.log('🔵 PaymentPage レンダリング:', {
      customerLoading,
      customer: customer ? 'exists' : 'null',
      pathname: window.location.pathname
    });
  }, [customerLoading, customer]);
  
  // 決済コード入力用の状態
  const [paymentCode, setPaymentCode] = useState('');
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'code'>('qr'); // QRコード or 決済コード
  
  // 決済方法選択（クレジット/現金）
  const [selectedPaymentType, setSelectedPaymentType] = useState<'credit' | 'cash' | null>(null);
  const [paymentCodeData, setPaymentCodeData] = useState<any>(null);

  const handleScan = (decodedText: string) => {
    try {
      const data = CustomerStripeService.parseQRCodeData(decodedText);
      if (data) {
        setScannedData(data);
        setScanning(false);
        setError('');
      } else {
        setError('無効なQRコードです');
      }
    } catch (err) {
      setError('無効なQRコードです');
    }
  };

  const startScanning = () => {
    setScanning(true);
    setError('');
    setScannedData(null);
  };

  const stopScanning = () => {
    setScanning(false);
  };

  // 決済コード検証（5桁・6桁両対応）
  const verifyPaymentCode = async () => {
    console.log('🔵 PaymentPage - 決済コード取得開始:', paymentCode);
    
    if (!paymentCode || (paymentCode.length !== 5 && paymentCode.length !== 6)) {
      setError('5桁または6桁の決済コードを入力してください');
      return;
    }

    setCodeVerifying(true);
    setError('');

    try {
      let data = null;
      let codeError = null;

      // 5桁の場合はpayment_codes、6桁の場合はpayment_codes_2から検索
      if (paymentCode.length === 5) {
        console.log('🔵 PaymentPage - 5桁コード検証開始');
        const result = await supabase
          .from('payment_codes')
          .select('*, payment_data')
          .eq('code', paymentCode)
          .gt('expires_at', new Date().toISOString()) // 有効期限チェック
          .single();
        data = result.data;
        codeError = result.error;
      } else if (paymentCode.length === 6) {
        console.log('🔵 PaymentPage - 6桁コード検証開始');
        const result = await supabase
          .from('payment_codes_2')
          .select('*, payment_data')
          .eq('code', paymentCode)
          .gt('expires_at', new Date().toISOString()) // 有効期限チェック
          .single();
        data = result.data;
        codeError = result.error;
      }

      if (codeError || !data) {
        console.error('🔵 PaymentPage - 決済コード検証エラー:', codeError);
        setError('無効な決済コードです。コードを確認してください。');
        setCodeVerifying(false);
        return;
      }

      console.log('🔵 PaymentPage - 取得した決済データ:', data);

      // 決済データを取得
      const paymentData = data.payment_data as any;
      
      // PaymentData形式に変換
      const paymentInfo: PaymentData = {
        store_id: paymentData.storeId,
        store_name: paymentData.storeName,
        amount: paymentData.totalAmount,
        points_to_use: paymentData.pointsUsed || 0,
        items: paymentData.items || []
      };

      setScannedData(paymentInfo);
      setPaymentCodeData(data); // 後で現金決済時に使用
      console.log('🔵 PaymentPage - 決済データ設定完了');
      
      // 決済コード入力時に選択された決済方法をリセット（決済確認ページで再選択させる）
      // ただし、既に選択されている場合は保持
      if (!selectedPaymentType) {
        // 選択されていない場合は、決済確認ページで選択させる
      } else {
        // 既に選択されている場合は、そのまま保持
        console.log('🔵 PaymentPage - 決済方法は既に選択済み:', selectedPaymentType);
      }
      
      setCodeVerifying(false);
    } catch (err) {
      console.error('決済コード検証エラー:', err);
      setError('決済コードの検証中にエラーが発生しました');
      setCodeVerifying(false);
    }
  };

  // 現金決済処理（売上の3%を記録）
  const handleCashPayment = async () => {
    if (!scannedData || !paymentCodeData) return;
    
    setProcessing(true);
    setError('');

    try {
      const paymentData = paymentCodeData.payment_data as any;
      const totalAmount = scannedData.amount;
      const feeAmount = Math.round(totalAmount * 0.03); // 3%手数料

      // 現金決済記録をテーブルに保存（売上と手数料を記録）
      const { error: cashError } = await supabase
        .from('cash_payments')
        .insert({
          payment_code: paymentCode,
          store_id: paymentData.storeId,
          customer_id: customer?.id || null,
          total_amount: totalAmount,
          fee_amount: feeAmount, // 3%手数料
          payment_data: paymentData,
          payment_method: 'cash',
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (cashError) {
        console.error('現金決済記録エラー:', cashError);
        setError('現金決済の記録に失敗しました');
        setProcessing(false);
        return;
      }

      // 成功メッセージ
      alert('現金決済が完了しました。店舗で直接お支払いください。');
      
      // ページをリセット
      setScannedData(null);
      setPaymentCodeData(null);
      setSelectedPaymentType(null);
      setPaymentCode('');
      
    } catch (err) {
      console.error('現金決済エラー:', err);
      setError('現金決済処理中にエラーが発生しました');
    } finally {
      setProcessing(false);
    }
  };

  // クレジット決済処理（Stripe）
  const handleCreditPayment = async () => {
    if (!scannedData) return;
    
    setProcessing(true);
    setError('');

    try {
      const result = await CustomerStripeService.processPayment(scannedData);
      
      if (result.success) {
        // 決済処理が成功した場合、Stripe Checkoutにリダイレクトされる
        console.log('決済処理開始成功');
      } else {
        setError(result.error || '決済処理に失敗しました');
      }
    } catch (err) {
      setError('決済処理中にエラーが発生しました');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentType) {
      setError('決済方法を選択してください');
      return;
    }

    if (selectedPaymentType === 'credit') {
      await handleCreditPayment();
    } else if (selectedPaymentType === 'cash') {
      await handleCashPayment();
    }
  };

  // エラー表示
  if (customerError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{customerError}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // ローディング中の表示
  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">決済</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {!scanning && !scannedData && (
            <div className="space-y-6">
              {/* 決済方法選択 */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setPaymentMethod('qr')}
                  className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                    paymentMethod === 'qr'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm">QRコード</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('code')}
                  className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                    paymentMethod === 'code'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Hash className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm">決済コード</span>
                </button>
              </div>

              {/* QRコード読み取り */}
              {paymentMethod === 'qr' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-10 w-10 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    店舗のQRコードを読み取ってください
                  </h2>
                  <p className="text-gray-600 mb-6">
                    店舗で表示されている決済QRコードをカメラで読み取ります
                  </p>
                  
                  <button
                    onClick={startScanning}
                    className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    QRコードを読み取る
                  </button>
                </div>
              )}

              {/* 決済コード入力（5桁・6桁対応） */}
              {paymentMethod === 'code' && (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Hash className="h-10 w-10 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    決済コードを入力してください
                  </h2>
                  <p className="text-gray-600 mb-4">
                    店舗から伝えられた5桁または6桁の決済コードを入力してください
                  </p>
                  
                  <div className="max-w-xs mx-auto mb-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={paymentCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 6) {
                          setPaymentCode(value);
                          setError('');
                        }
                      }}
                      placeholder="5桁または6桁のコード"
                      className="w-full px-4 py-3 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {paymentCode.length === 5 && '基本決済（5分間有効）'}
                      {paymentCode.length === 6 && '遠距離決済（1ヶ月間有効）'}
                      {paymentCode.length > 0 && paymentCode.length !== 5 && paymentCode.length !== 6 && '5桁または6桁のコードを入力してください'}
                    </p>
                  </div>
                  
                  {/* 決済方法の事前選択 */}
                  {paymentCode.length >= 5 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-purple-900 mb-3">決済方法を選択してください</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setSelectedPaymentType('credit');
                            verifyPaymentCode();
                          }}
                          className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center justify-center"
                        >
                          <CreditCard className="h-6 w-6 mb-1" />
                          <span className="text-sm font-semibold">クレジット</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPaymentType('cash');
                            verifyPaymentCode();
                          }}
                          className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex flex-col items-center justify-center"
                        >
                          <div className="h-6 w-6 mb-1 flex items-center justify-center text-xl">💴</div>
                          <span className="text-sm font-semibold">現金</span>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={verifyPaymentCode}
                    disabled={codeVerifying || paymentCode.length < 5}
                    className="bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {codeVerifying ? '検証中...' : '決済コードを確認'}
                  </button>
                </div>
              )}
            </div>
          )}

          {scanning && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                QRコードを読み取り中...
              </h2>
              <p className="text-gray-600 mb-6">
                カメラをQRコードに向けてください
              </p>
              
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center mb-4">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">カメラがここに表示されます</p>
                  <p className="text-sm text-gray-500">html5-qrcode 統合予定</p>
                </div>
              </div>
              
              <button
                onClick={stopScanning}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
            </div>
          )}

          {scannedData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {paymentCodeData?.payment_data?.is_dynamic ? '動的決済: 金額が正確に反映されます' : '決済情報確認'}
                </h2>
                {paymentCodeData?.payment_data?.is_dynamic && (
                  <p className="text-sm text-gray-600 mb-2">
                    金額が正確に反映される安全なStripe決済システム
                  </p>
                )}
              </div>

              {/* 決済情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">決済情報</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">店舗名:</span>
                    <span className="font-medium">{scannedData.store_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">決済金額:</span>
                    <span className="font-medium text-lg text-green-600">
                      ¥{scannedData.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">使用ポイント:</span>
                    <span className="font-medium text-blue-600">
                      {scannedData.points_to_use} pt
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最終決済金額:</span>
                    <span className="font-medium text-lg text-green-600">
                      ¥{Math.max(0, scannedData.amount - scannedData.points_to_use).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 決済方法選択（常に表示 - 選択済みでも変更可能） */}
              <div className="space-y-3">
                <p className="text-center font-medium text-gray-900">
                  {selectedPaymentType ? '決済方法を変更できます' : '決済方法を選択してください'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* クレジット決済ボタン */}
                  <button
                    onClick={() => {
                      console.log('🔵 PaymentPage - クレジット決済ボタンクリック');
                      setSelectedPaymentType('credit');
                    }}
                    className={`py-4 px-6 rounded-lg transition-colors flex flex-col items-center justify-center ${
                      selectedPaymentType === 'credit'
                        ? 'bg-blue-700 text-white ring-4 ring-blue-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <CreditCard className="h-8 w-8 mb-2" />
                    <span className="font-semibold">クレジット決済</span>
                    <span className="text-xs mt-1">Stripe決済</span>
                    {selectedPaymentType === 'credit' && (
                      <span className="text-xs mt-1 text-blue-200">✓ 選択中</span>
                    )}
                  </button>
                  
                  {/* 現金決済ボタン - 別ページに遷移 */}
                  <button
                    onClick={() => {
                      console.log('🔵 PaymentPage - 現金決済ボタンクリック（別ページへ）');
                      // 決済コードとデータをURLパラメータまたはstateで渡す
                      navigate('/cash-payment', { 
                        state: { 
                          paymentCode, 
                          paymentCodeData: paymentCodeData || null,
                          scannedData 
                        } 
                      });
                    }}
                    className="py-4 px-6 rounded-lg transition-colors flex flex-col items-center justify-center bg-green-600 text-white hover:bg-green-700"
                  >
                    <div className="h-8 w-8 mb-2 flex items-center justify-center text-2xl">💴</div>
                    <span className="font-semibold">現金決済</span>
                    <span className="text-xs mt-1">店舗で直接お支払い</span>
                  </button>
                </div>
              </div>

              {/* 選択された決済方法の表示 */}
              {selectedPaymentType === 'credit' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-semibold text-blue-900">クレジット決済を選択しました</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Stripe決済に進みます。安全にクレジットカードでお支払いいただけます。
                  </p>
                </div>
              )}

              {selectedPaymentType === 'cash' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="text-xl mr-2">💴</div>
                    <span className="font-semibold text-green-900">現金決済を選択しました</span>
                  </div>
                  <p className="text-sm text-green-700">
                    店舗で直接現金でお支払いください。決済情報は記録されます。
                  </p>
                </div>
              )}

              {/* 注意事項 */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">ご注意</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {selectedPaymentType === 'credit' && (
                        <>
                          <li>• 決済完了後、ポイントが自動的に付与されます</li>
                          <li>• 決済金額の5%がポイントとして加算されます</li>
                          <li>• 決済処理中はページを閉じないでください</li>
                        </>
                      )}
                      {selectedPaymentType === 'cash' && (
                        <>
                          <li>• 店舗で直接現金でお支払いください</li>
                          <li>• 決済情報は記録され、ポイントが付与されます</li>
                          <li>• 売上の3%が手数料として記録されます</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setScannedData(null);
                    setPaymentCodeData(null);
                    setSelectedPaymentType(null);
                    setError('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  やり直す
                </button>
                {selectedPaymentType && (
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className={`flex-1 py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPaymentType === 'credit'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {processing ? '処理中...' : selectedPaymentType === 'credit' ? 'クレジット決済を実行' : '現金決済を確定'}
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
export const StorePayment = PaymentPage; // エイリアスとして追加（ビルド時のファイル名対応）
