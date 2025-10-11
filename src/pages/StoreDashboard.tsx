import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Calendar,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Building,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  getConnectedAccount,
  getStoreTransactions,
  getStoreRevenueStats,
  type ConnectedAccountInfo,
  type PaymentTransaction,
  type RevenueStats
} from '../services/stripeConnectService';

export const StoreDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store_id');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [accountInfo, setAccountInfo] = useState<ConnectedAccountInfo | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (storeId) {
      loadDashboardData();
    } else {
      setError('店舗IDが指定されていません');
      setLoading(false);
    }
  }, [storeId, dateRange]);

  const loadDashboardData = async () => {
    if (!storeId) return;

    setLoading(true);
    setError('');

    try {
      // アカウント情報を取得
      const accountResult = await getConnectedAccount(storeId);
      if (accountResult.success && accountResult.account) {
        setAccountInfo(accountResult.account);
      }

      // トランザクション履歴を取得
      const transactionsResult = await getStoreTransactions(storeId, 50);
      if (transactionsResult.success && transactionsResult.transactions) {
        setTransactions(transactionsResult.transactions);
      }

      // 売上統計を取得
      const startDate = getStartDate(dateRange);
      const statsResult = await getStoreRevenueStats(storeId, startDate);
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }

    } catch (error) {
      console.error('ダッシュボードデータ読み込みエラー:', error);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStartDate = (range: string): string | undefined => {
    const now = new Date();
    switch (range) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString().split('T')[0];
      default:
        return undefined;
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            成功
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <RefreshCw className="h-3 w-3 mr-1" />
            処理中
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            失敗
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ダッシュボードを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/menu')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-4"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">店舗ダッシュボード</h1>
                <p className="text-sm text-gray-600">売上・決済管理</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-6 w-6 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* アカウント状態 */}
        {accountInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <Building className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">アカウント状態</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">決済受付</p>
                <p className="text-lg font-bold text-blue-900">
                  {accountInfo.charges_enabled ? '有効' : '無効'}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 mb-1">入金</p>
                <p className="text-lg font-bold text-green-900">
                  {accountInfo.payouts_enabled ? '有効' : '無効'}
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700 mb-1">詳細情報</p>
                <p className="text-lg font-bold text-purple-900">
                  {accountInfo.details_submitted ? '提出済み' : '未提出'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 期間選択 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-gray-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">期間選択</h2>
            </div>
            
            <div className="flex space-x-2">
              {(['today', 'week', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range === 'today' && '今日'}
                  {range === 'week' && '7日間'}
                  {range === 'month' && '30日間'}
                  {range === 'all' && '全期間'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 売上統計 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* 総売上 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">総売上</p>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_sales)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total_transactions}件の取引
              </p>
            </div>

            {/* プラットフォーム手数料 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">手数料</p>
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_platform_fees + stats.total_stripe_fees)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                プラットフォーム + Stripe
              </p>
            </div>

            {/* 純売上 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">純売上</p>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_net_revenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                手数料差引後
              </p>
            </div>

            {/* 平均取引額 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">平均取引額</p>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(Math.round(stats.average_transaction_amount))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                1取引あたり
              </p>
            </div>
          </div>
        )}

        {/* 決済履歴 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">決済履歴</h2>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">決済履歴がありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">日時</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">決済コード</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">金額</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">手数料</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">純額</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-900">
                        {transaction.payment_code}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600">
                        {formatCurrency(transaction.platform_fee + transaction.stripe_fee)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                        {formatCurrency(transaction.store_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(transaction.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;

