import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Hash } from 'lucide-react';
import { useCustomer } from '../contexts/CustomerContext';
import { supabase } from '../lib/supabase';

const CashPaymentPage: React.FC = () => {
  console.log('💴 CashPaymentPage コンポーネント開始');
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, loading: customerLoading, error: customerError } = useCustomer();
  
  // location.stateから決済コードとデータを取得
  const [paymentCode, setPaymentCode] = useState(location.state?.paymentCode || '');
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [scannedData, setScannedData] = useState<any>(location.state?.scannedData || null);
  const [paymentCodeData, setPaymentCodeData] = useState<any>(location.state?.paymentCodeData || null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // location.stateからデータが渡された場合、自動的に検証済み状態にする
  useEffect(() => {
    if (location.state?.scannedData && location.state?.paymentCodeData) {
      console.log('💴 CashPaymentPage - location.stateからデータを取得:', {
        paymentCode: location.state.paymentCode,
        hasScannedData: !!location.state.scannedData,
        hasPaymentCodeData: !!location.state.paymentCodeData
      });
      setPaymentCode(location.state.paymentCode || '');
      setScannedData(location.state.scannedData);
      setPaymentCodeData(location.state.paymentCodeData);
    }
  }, [location.state]);

  // 決済コード検証
  const verifyPaymentCode = async () => {
    console.log('💴 CashPaymentPage - 決済コード取得開始:', paymentCode);
    
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
        console.log('💴 CashPaymentPage - 5桁コード検証開始');
        const result = await supabase
          .from('payment_codes')
          .select('*, payment_data')
          .eq('code', paymentCode)
          .gt('expires_at', new Date().toISOString())
          .single();
        data = result.data;
        codeError = result.error;
      } else if (paymentCode.length === 6) {
        console.log('💴 CashPaymentPage - 6桁コード検証開始');
        const result = await supabase
          .from('payment_codes_2')
          .select('*, payment_data')
          .eq('code', paymentCode)
          .gt('expires_at', new Date().toISOString())
          .single();
        data = result.data;
        codeError = result.error;
      }

      if (codeError || !data) {
        console.error('💴 CashPaymentPage - 決済コード検証エラー:', codeError);
        setError('無効な決済コードです。コードを確認してください。');
        setCodeVerifying(false);
        return;
      }

      console.log('💴 CashPaymentPage - 取得した決済データ:', data);

      // 決済データを取得
      const paymentData = data.payment_data as any;
      
      // 決済情報を設定
      const paymentInfo = {
        store_id: paymentData.storeId,
        store_name: paymentData.storeName,
        amount: paymentData.totalAmount,
        points_to_use: paymentData.pointsUsed || 0,
        items: paymentData.items || []
      };

      setScannedData(paymentInfo);
      setPaymentCodeData(data);
      console.log('💴 CashPaymentPage - 決済データ設定完了');
      
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

      console.log('💴 CashPaymentPage - 現金決済記録開始:', {
        payment_code: paymentCode,
        store_id: paymentData.storeId,
        customer_id: customer?.id,
        total_amount: totalAmount,
        fee_amount: feeAmount
      });

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
        setError('現金決済の記録に失敗しました: ' + cashError.message);
        setProcessing(false);
        return;
      }

      console.log('💴 CashPaymentPage - 現金決済記録成功');

      // 成功メッセージ
      alert('現金決済が完了しました。店舗で直接お支払いください。\n\n決済金額: ¥' + totalAmount.toLocaleString() + '\n手数料（3%）: ¥' + feeAmount.toLocaleString());
      
      // ページをリセット
      setScannedData(null);
      setPaymentCodeData(null);
      setPaymentCode('');
      navigate('/customer-menu');
      
    } catch (err) {
      console.error('現金決済エラー:', err);
      setError('現金決済処理中にエラーが発生しました');
    } finally {
      setProcessing(false);
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
            onClick={() => navigate('/customer-menu')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            メニューに戻る
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
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
            onClick={() => navigate('/customer-menu')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">現金決済</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {!scannedData ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-4xl">💴</div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  決済コードを入力してください
                </h2>
                <p className="text-gray-600 mb-4">
                  店舗から伝えられた5桁または6桁の決済コードを入力してください
                </p>
              </div>
              
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
                  className="w-full px-4 py-3 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {paymentCode.length === 5 && '基本決済（5分間有効）'}
                  {paymentCode.length === 6 && '遠距離決済（1ヶ月間有効）'}
                  {paymentCode.length > 0 && paymentCode.length !== 5 && paymentCode.length !== 6 && '5桁または6桁のコードを入力してください'}
                </p>
              </div>
              
              <button
                onClick={verifyPaymentCode}
                disabled={codeVerifying || paymentCode.length < 5}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {codeVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    検証中...
                  </>
                ) : (
                  <>
                    <Hash className="h-5 w-5 mr-2" />
                    決済コードを確認
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-4xl">💴</div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  現金決済確認
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  店舗で直接現金でお支払いください
                </p>
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
                      ¥{(scannedData.amount || 0).toLocaleString()}
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
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600">手数料（3%）:</span>
                    <span className="font-medium text-orange-600">
                      ¥{Math.round(Math.max(0, scannedData.amount - scannedData.points_to_use) * 0.03).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 注意事項 */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">ご注意</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• 店舗で直接現金でお支払いください</li>
                      <li>• 決済情報は記録され、ポイントが付与されます</li>
                      <li>• 売上の3%が手数料として記録されます</li>
                      <li>• 決済完了後、店舗スタッフに確認してください</li>
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
                    setPaymentCode('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  やり直す
                </button>
                <button
                  onClick={handleCashPayment}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      処理中...
                    </>
                  ) : (
                    <>
                      <div className="text-xl mr-2">💴</div>
                      現金決済を確定
                    </>
                  )}
                </button>
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

export default CashPaymentPage;

