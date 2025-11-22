import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  ShoppingBag,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { RankingService } from '../services/rankingService';
import type { 
  StoreRankingData, 
  CustomerRankingData, 
  MonthlyRankingData, 
  ProductRankingData 
} from '../services/rankingService';

const StoreAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'customers' | 'products' | 'monthly'>('overview');
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  
  const [analytics, setAnalytics] = useState<{
    storeRanking: StoreRankingData[];
    customerRanking: CustomerRankingData[];
    monthlyRanking: MonthlyRankingData[];
    productRanking: ProductRankingData[];
  }>({
    storeRanking: [],
    customerRanking: [],
    monthlyRanking: [],
    productRanking: []
  });

  const [error, setError] = useState<string | null>(null);

  // データ取得関数
  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [storeRanking, customerRanking, productRanking] = await Promise.all([
        RankingService.getStoreRanking(),
        RankingService.getCustomerRanking(),
        RankingService.getProductRanking()
      ]);

      // 現在の月の月次ランキングを取得
      const currentDate = new Date();
      const monthlyRanking = await RankingService.getMonthlyRanking(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );

      setAnalytics({
        storeRanking,
        customerRanking,
        monthlyRanking,
        productRanking
      });
    } catch (err) {
      console.error('分析データ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const tabs = [
    { id: 'overview', label: '店舗概要', icon: BarChart3 },
    { id: 'customers', label: '顧客分析', icon: Users },
    { id: 'products', label: '商品分析', icon: ShoppingBag },
    { id: 'monthly', label: '月次分析', icon: Calendar }
  ];

  const formatCurrency = (amount: number) => {
    return `¥${amount?.toLocaleString()}`;
  };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('ja-JP');
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">店舗分析</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                {showSensitiveData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showSensitiveData ? '詳細非表示' : '詳細表示'}
              </button>
              <button
                onClick={loadAnalytics}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                更新
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブナビゲーション */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as 'stores' | 'customers' | 'monthly' | 'products' | 'payment')}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* コンテンツ */}
        {!loading && (
          <>
            {/* 店舗概要 */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                    店舗ランキング（売上順）
                  </h2>
                  <div className="space-y-3">
                    {analytics.storeRanking.slice(0, 10).map((store) => (
                      <div key={store.store_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold mr-3">
                            {store.rank}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {showSensitiveData ? store.store_name : `店舗${store.rank}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                              決済回数: {store.total_payments}回 | 顧客数: {store.unique_customers}人
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(store.total_sales)}</p>
                          <p className="text-sm text-gray-500">平均: {formatCurrency(store.average_payment)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 顧客分析 */}
            {selectedTab === 'customers' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-500" />
                    顧客ランキング（支出順）
                  </h2>
                  <div className="space-y-3">
                    {analytics.customerRanking.slice(0, 20).map((customer) => (
                      <div key={customer.customer_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-bold mr-3">
                            {customer.rank}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {showSensitiveData ? customer.customer_name : `顧客${customer.rank}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                              決済回数: {customer.total_payments}回 | ポイント使用: {customer.total_points_used}pt
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(customer.total_spent)}</p>
                          <p className="text-sm text-gray-500">平均: {formatCurrency(customer.average_payment)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 商品分析 */}
            {selectedTab === 'products' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2 text-purple-500" />
                    商品別売上ランキング
                  </h2>
                  <div className="space-y-3">
                    {analytics.productRanking.slice(0, 20).map((product, index) => (
                      <div key={`${product.product_name}-${product.store_id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{product.product_name}</h3>
                            <p className="text-sm text-gray-500">
                              {showSensitiveData ? product.store_name : '店舗'} | 
                              販売回数: {product.times_sold}回 | 
                              数量: {product.total_quantity}個
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(product.total_revenue)}</p>
                          <p className="text-sm text-gray-500">平均: {formatCurrency(product.average_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 月次分析 */}
            {selectedTab === 'monthly' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                    月次売上ランキング（今月）
                  </h2>
                  <div className="space-y-3">
                    {analytics.monthlyRanking.slice(0, 10).map((monthly) => (
                      <div key={monthly.store_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full text-sm font-bold mr-3">
                            {monthly.rank}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {showSensitiveData ? monthly.store_name : `店舗${monthly.rank}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                              決済回数: {monthly.monthly_payments}回 | 顧客数: {monthly.unique_customers}人
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(monthly.monthly_sales)}</p>
                          <p className="text-sm text-gray-500">平均: {formatCurrency(monthly.average_payment)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 注意事項 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-yellow-400">⚠️</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">機密情報について</h3>
              <p className="mt-1 text-sm text-yellow-700">
                このページには店舗の詳細な売上データが含まれています。適切に管理し、外部に漏洩しないよう注意してください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreAnalytics;
