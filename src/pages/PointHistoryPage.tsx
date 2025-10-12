import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { ArrowLeft, TrendingUp, TrendingDown, Gift, Calendar } from 'lucide-react';
import type { PointHistory } from '../types/customer';

const PointHistoryPage: React.FC = () => {
  const { customer, getPointHistory } = useCustomer();
  const navigate = useNavigate();
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (customer && customer.id) {
          const data = await getPointHistory();
          setHistory(data);
        } else {
          console.log('顧客データがまだ読み込まれていません');
          setHistory([]);
        }
      } catch (error) {
        console.error('ポイント履歴の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [customer, getPointHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">ポイント履歴</h1>
        </div>

        {/* 現在のポイント情報 */}
        {customer && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">現在のポイント</p>
                <p className="text-3xl font-bold text-green-600">{customer.points} pt</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">レベル</p>
                <p className="text-3xl font-bold text-blue-600">Lv.{customer.level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">総獲得ポイント</p>
                <p className="text-3xl font-bold text-purple-600">
                  {history
                    .filter(item => item.type === 'earned')
                    .reduce((sum, item) => sum + item.points, 0)} pt
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 履歴リスト */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">取引履歴</h2>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">まだポイント履歴がありません</p>
              <p className="text-sm text-gray-500 mt-2">
                店舗でお買い物をするとポイントが貯まります
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {history.map((item, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        item.type === 'earned' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {item.type === 'earned' ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.reason}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {item.created_at && formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        item.type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.type === 'earned' ? '+' : ''}{item.points} pt
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {item.type === 'earned' ? '獲得' : '使用'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ポイントシステム説明 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">ポイントシステムについて</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">ポイント獲得</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 購入金額の5%がポイントとして付与</li>
                <li>• 全国の加盟店舗で利用可能</li>
                <li>• ポイントは即座に反映されます</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">ポイント使用</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 1ポイント = 1円として使用可能</li>
                <li>• 1回の使用限度：最大1,500ポイント</li>
                <li>• 繁忙期（母の日、年末、クリスマス前1週間）は使用不可</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointHistoryPage;
