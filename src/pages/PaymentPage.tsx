import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Camera, CreditCard, AlertCircle } from 'lucide-react';
import { CustomerStripeService, type PaymentData } from '../services/customerStripeService';
import { useCustomer } from '../contexts/CustomerContext';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { customer } = useCustomer();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

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

  const handlePayment = async () => {
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
                  QRコード読み取り完了
                </h2>
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
              <div className="flex justify-between">
                <span className="text-gray-600">決済方法:</span>
                <span className="font-medium">Stripe Connect</span>
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
                      <li>• 決済完了後、ポイントが自動的に付与されます</li>
                      <li>• 決済金額の5%がポイントとして加算されます</li>
                      <li>• 決済処理中はページを閉じないでください</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setScannedData(null);
                    setError('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  やり直す
                </button>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? '処理中...' : '決済を実行'}
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

export default PaymentPage;
