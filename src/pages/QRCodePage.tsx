import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import QRCode from 'qrcode.react';
import { QrCode, ArrowLeft, Copy, Download } from 'lucide-react';

const QRCodePage: React.FC = () => {
  const { customer } = useCustomer();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    if (customer) {
      const data = {
        customer_id: customer.user_id,
        name: customer.name,
        points: customer.points,
        level: customer.level,
        timestamp: new Date().toISOString()
      };
      setQrData(JSON.stringify(data));
    }
  }, [customer]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      alert('QRコードデータをクリップボードにコピーしました');
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'customer-qr-code.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <p className="text-gray-600">顧客データが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">マイQRコード</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 顧客情報 */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{customer.name}</h2>
            <p className="text-gray-600">{customer.email}</p>
          </div>

          {/* ポイント情報 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">現在のポイント</p>
                <p className="text-2xl font-bold text-green-600">{customer.points} pt</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">レベル</p>
                <p className="text-2xl font-bold text-blue-600">Lv.{customer.level}</p>
              </div>
            </div>
          </div>

          {/* QRコード */}
          <div className="text-center mb-6">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <QRCode
                value={qrData}
                size={200}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          </div>

          {/* 説明 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">使用方法</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 店舗でこのQRコードを見せてください</li>
              <li>• 使用するポイント数を口頭でお伝えください</li>
              <li>• 1ポイント = 1円として使用できます</li>
              <li>• 使用限度額：1回につき最大1,500ポイント</li>
            </ul>
          </div>

          {/* 注意事項 */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">ご注意</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 母の日前、年末前、クリスマス前の1週間は使用できません</li>
              <li>• 店舗により交換できる商品が異なります</li>
              <li>• 使用前に店舗にご確認ください</li>
            </ul>
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-4">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Copy className="h-4 w-4 mr-2" />
              データコピー
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              QR保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
