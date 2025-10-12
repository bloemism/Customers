import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { getConnectedAccount } from '../services/stripeConnectService';

export const StripeConnectReturn: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store_id');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (storeId) {
      verifyAccount();
    } else {
      setError('店舗IDが指定されていません');
      setLoading(false);
    }
  }, [storeId]);

  const verifyAccount = async () => {
    if (!storeId) return;

    setLoading(true);

    try {
      // 少し待ってからアカウント情報を取得（Stripeの更新を待つ）
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await getConnectedAccount(storeId);

      if (result.success && result.hasAccount) {
        if (result.account?.details_submitted && result.account?.charges_enabled) {
          setSuccess(true);
        } else {
          setError('オンボーディングが完了していません。もう一度お試しください。');
        }
      } else {
        setError(result.error || 'アカウントの確認に失敗しました');
      }
    } catch (error) {
      console.error('アカウント確認エラー:', error);
      setError('アカウントの確認に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">アカウントを確認中...</h1>
          <p className="text-gray-600">少々お待ちください</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            設定完了！
          </h1>
          <p className="text-gray-600 mb-6">
            Stripe Connectの設定が完了しました。<br />
            決済を受け付ける準備が整いました。
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/store-dashboard?store_id=${storeId}`)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              ダッシュボードを見る
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/menu')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <div className="mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          エラー
        </h1>
        <p className="text-gray-600 mb-6">{error}</p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/stripe-connect-onboarding?store_id=${storeId}`)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            もう一度試す
          </button>
          
          <button
            onClick={() => navigate('/menu')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeConnectReturn;


