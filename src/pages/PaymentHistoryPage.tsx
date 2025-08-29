import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { ArrowLeft, Receipt, Calendar, CreditCard } from 'lucide-react';
import type { CustomerPayment } from '../types/customer';

const PaymentHistoryPage: React.FC = () => {
  const { customer, getPaymentHistory } = useCustomer();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await getPaymentHistory();
        setPayments(data);
      } catch (error) {
        console.error('決済履歴の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [getPaymentHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'pending':
        return '処理中';
      case 'failed':
        return '失敗';
      default:
        return '不明';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">決済履歴</h1>
        </div>

        {/* 統計情報 */}
        {customer && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">総決済回数</p>
                <p className="text-2xl font-bold text-blue-600">{payments.length}回</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">総決済金額</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{payments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">総獲得ポイント</p>
                <p className="text-2xl font-bold text-purple-600">
                  {payments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + Math.floor(p.amount * 0.05), 0)} pt
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 決済履歴リスト */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">決済履歴</h2>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">まだ決済履歴がありません</p>
              <p className="text-sm text-gray-500 mt-2">
                店舗で決済を行うと履歴が表示されます
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {payments.map((payment, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900">
                            店舗ID: {payment.store_id}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {payment.created_at && formatDate(payment.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ¥{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        ポイント使用: {payment.points_used} pt
                      </p>
                    </div>
                  </div>
                  
                  {/* 決済詳細 */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">決済方法:</span>
                        <span className="ml-2 font-medium">{payment.payment_method}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">獲得ポイント:</span>
                        <span className="ml-2 font-medium text-blue-600">
                          +{Math.floor(payment.amount * 0.05)} pt
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 決済システム説明 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">決済システムについて</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">決済方法</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• クレジットカード決済</li>
                <li>• 店舗QRコード読み取り</li>
                <li>• セキュアな決済処理</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">ポイント付与</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 決済金額の5%がポイント付与</li>
                <li>• 即座に反映されます</li>
                <li>• 全国加盟店舗で利用可能</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
