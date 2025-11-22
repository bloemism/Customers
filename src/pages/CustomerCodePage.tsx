import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export const CustomerCodePage: React.FC = () => {
  const { customer } = useCustomerAuth();
  const navigate = useNavigate();
  const [customerCode, setCustomerCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCustomerCode = async () => {
      if (!customer) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('customers')
          .select('customer_code')
          .eq('id', customer.id)
          .single();

        if (fetchError) {
          console.error('顧客コード取得エラー:', fetchError);
          setError('顧客コードの取得に失敗しました');
        } else if (data) {
          setCustomerCode(data.customer_code);
        }
      } catch (err) {
        console.error('顧客コード取得エラー:', err);
        setError('顧客コードの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerCode();
  }, [customer]);

  const handleCopy = () => {
    if (customerCode) {
      navigator.clipboard.writeText(customerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Loader className="animate-spin h-10 w-10 text-purple-500" />
        <p className="ml-3 text-gray-700">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">エラー</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/customer-menu')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/customer-menu')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">マイ顧客コード</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {customer && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <User className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">顧客情報</h2>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700"><span className="font-medium">お名前:</span> {customer.name}</p>
              <p className="text-gray-700"><span className="font-medium">メール:</span> {customer.email}</p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-6 text-center">
          <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-md">
            <User className="h-12 w-12 text-purple-600" />
          </div>
          
          <h2 className="text-lg font-semibold text-gray-700 mb-2">あなたの顧客コード</h2>
          
          {customerCode ? (
            <>
              <div className="bg-white rounded-2xl p-8 mb-6 shadow-inner">
                <p className="text-6xl font-mono font-bold text-purple-600 tracking-wider">
                  {customerCode}
                </p>
              </div>

              <button
                onClick={handleCopy}
                className="w-full bg-purple-600 text-white py-4 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center font-medium text-lg"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    コピーしました！
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 mr-2" />
                    コードをコピー
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
              <p className="text-yellow-800">顧客コードが設定されていません</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">顧客コードの使い方</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="mr-3 text-purple-600 font-bold">1.</span>
              <p>店舗やレッスンスクールで、このコードをスタッフに伝えてください</p>
            </div>
            <div className="flex items-start">
              <span className="mr-3 text-purple-600 font-bold">2.</span>
              <p>スタッフがコードを入力すると、あなたの情報が登録されます</p>
            </div>
            <div className="flex items-start">
              <span className="mr-3 text-purple-600 font-bold">3.</span>
              <p>登録後、そのスクールのレッスンスケジュールが閲覧できます</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
