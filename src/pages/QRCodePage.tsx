import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCustomer } from '../contexts/CustomerContext';
import { ArrowLeft, QrCode, Copy, Download, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode.react';

export const QRCodePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customer, refreshCustomer } = useCustomer();
  const [qrData, setQrData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      const data = JSON.stringify({
        customer_id: customer.user_id,
        email: customer.email,
        points: customer.points,
        level: customer.level
      });
      setQrData(data);
    }
  }, [customer]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshCustomer();
    } catch (error) {
      console.error('顧客データ更新エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyQR = () => {
    navigator.clipboard.writeText(qrData);
    alert('QRコードデータをコピーしました');
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-code-${customer?.user_id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const getLevelInfo = (level: number) => {
    const levels = {
      1: { name: 'ベーシック', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      2: { name: 'レギュラー', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      3: { name: 'プロ', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      4: { name: 'エキスパート', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    };
    return levels[level as keyof typeof levels] || levels[1];
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">顧客データを読み込み中...</p>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(customer.level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </button>
            <h1 className="text-xl font-bold text-gray-900">QRコード・ポイント</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顧客情報カード */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">顧客情報</h2>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">顧客ID</p>
                  <p className="font-mono text-gray-900">{customer.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">メールアドレス</p>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">名前</p>
                  <p className="text-gray-900">{customer.name || '未設定'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ポイント・レベル</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">現在のポイント</p>
                  <p className="text-3xl font-bold text-green-600">{customer.points} pt</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">レベル</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full ${levelInfo.bgColor}`}>
                    <span className={`font-semibold ${levelInfo.color}`}>
                      {levelInfo.name} (Lv.{customer.level})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QRコードカード */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">QRコード</h2>
            <p className="text-gray-600">
              店舗でこのQRコードを読み取って決済してください
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            {/* QRコード */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
              {qrData ? (
                <QRCode
                  value={qrData}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded-lg">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex space-x-4">
              <button
                onClick={handleCopyQR}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                QRデータをコピー
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                QRコードをダウンロード
              </button>
            </div>
          </div>
        </div>

        {/* 使用方法 */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">使用方法</h3>
          <div className="space-y-3 text-blue-800">
            <p>1. 店舗でこのQRコードを店員に見せてください</p>
            <p>2. 店員がQRコードを読み取ります</p>
            <p>3. 決済時にポイントが自動で適用されます</p>
            <p>4. 購入後、ポイントが加算されます</p>
          </div>
        </div>
      </div>
    </div>
  );
};
