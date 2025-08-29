import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Home, Receipt } from 'lucide-react';

const PaymentCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, storeName } = location.state || {};

  const earnedPoints = amount ? Math.floor(amount * 0.05) : 0;

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
          <h1 className="text-2xl font-bold text-gray-900">決済完了</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* 成功アイコン */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            決済が完了しました
          </h2>
          <p className="text-gray-600 mb-8">
            ご利用ありがとうございました
          </p>

          {/* 決済詳細 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">決済詳細</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">店舗名:</span>
                <span className="font-medium">{storeName || '未設定'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">決済金額:</span>
                <span className="font-medium text-lg text-green-600">
                  ¥{amount?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">獲得ポイント:</span>
                <span className="font-medium text-lg text-blue-600">
                  +{earnedPoints} pt
                </span>
              </div>
            </div>
          </div>

          {/* ポイント説明 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-8">
            <h4 className="font-medium text-blue-900 mb-2">ポイントについて</h4>
            <p className="text-sm text-blue-800">
              決済金額の5%がポイントとして付与されました。
              次回のお買い物でご利用いただけます。
            </p>
          </div>

          {/* アクションボタン */}
          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Home className="h-5 w-5 mr-2" />
              ホームに戻る
            </button>
            
            <button
              onClick={() => navigate('/payment-history')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Receipt className="h-5 w-5 mr-2" />
              決済履歴を見る
            </button>
          </div>
        </div>

        {/* 追加情報 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">今後のご利用について</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• 獲得したポイントは即座に反映されます</p>
            <p>• ポイントは全国の加盟店舗でご利用いただけます</p>
            <p>• 1ポイント = 1円として使用できます</p>
            <p>• 決済履歴は「決済履歴」ページでご確認いただけます</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCompletePage;
