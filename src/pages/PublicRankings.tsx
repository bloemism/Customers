import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Trophy, 
  Calendar,
  DollarSign,
  Gift,
  Users,
  MapPin,
  BarChart3,
  RefreshCw,
  ShoppingCart,
  Flower,
  Star,
  Heart,
  Leaf,
  CreditCard,
  Banknote
} from 'lucide-react';
import { PublicRankingService } from '../services/publicRankingService';
import type { 
  RegionalStatistics, 
  ProductPopularity, 
  PointsUsageStats, 
  SeasonalTrends, 
  PaymentMethodTrends 
} from '../services/publicRankingService';

const PublicRankings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'regional' | 'products' | 'points' | 'seasonal' | 'payment'>('regional');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('東京都');
  
  const [rankings, setRankings] = useState<{
    regional: RegionalStatistics[];
    products: ProductPopularity[];
    points: PointsUsageStats[];
    seasonal: SeasonalTrends[];
    payment: PaymentMethodTrends[];
    regionalProducts: ProductPopularity[];
  }>({
    regional: [],
    products: [],
    points: [],
    seasonal: [],
    payment: [],
    regionalProducts: []
  });

  const [error, setError] = useState<string | null>(null);

  // データ取得関数
  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [regional, products, points, seasonal, payment] = await Promise.all([
        PublicRankingService.getRegionalStatistics(),
        PublicRankingService.getProductPopularity(),
        PublicRankingService.getPointsUsageStats(),
        PublicRankingService.getSeasonalTrends(),
        PublicRankingService.getPaymentMethodTrends()
      ]);

      setRankings(prev => ({
        ...prev,
        regional,
        products,
        points,
        seasonal,
        payment
      }));
    } catch (err) {
      console.error('ランキングデータ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 地域別商品ランキング取得
  const loadRegionalProducts = async (prefecture: string) => {
    try {
      const regionalProducts = await PublicRankingService.getRegionalProductRanking(prefecture);
      setRankings(prev => ({
        ...prev,
        regionalProducts
      }));
    } catch (err) {
      console.error('地域別商品ランキング取得エラー:', err);
    }
  };

  // 地域変更
  const handlePrefectureChange = (prefecture: string) => {
    setSelectedPrefecture(prefecture);
    loadRegionalProducts(prefecture);
  };

  // タブ変更
  const handleTabChange = (tab: 'regional' | 'products' | 'points' | 'seasonal' | 'payment') => {
    setSelectedTab(tab);
  };

  useEffect(() => {
    loadRankings();
  }, []);

  useEffect(() => {
    if (selectedTab === 'products' && rankings.regional.length > 0) {
      loadRegionalProducts(selectedPrefecture);
    }
  }, [selectedTab, selectedPrefecture, rankings.regional]);

  const tabs = [
    { id: 'regional', label: '地域別統計', icon: MapPin },
    { id: 'products', label: '人気商品', icon: Flower },
    { id: 'points', label: 'ポイント使用', icon: Gift },
    { id: 'seasonal', label: '季節トレンド', icon: Calendar },
    { id: 'payment', label: '決済方法', icon: CreditCard }
  ];

  const prefectures = [
    '東京都', '大阪府', '愛知県', '神奈川県', '埼玉県', '千葉県', '兵庫県', 
    '北海道', '福岡県', '静岡県', '茨城県', '広島県', '京都府', '宮城県'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
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
                <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">人気ランキング</h1>
              </div>
            </div>
            <button
              onClick={loadRankings}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
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
                    onClick={() => handleTabChange(tab.id as any)}
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
            {/* 地域別統計 */}
            {selectedTab === 'regional' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                    地域別統計（直近30日）
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rankings.regional.map((region, index) => (
                      <div key={region.prefecture} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{region.prefecture}</h3>
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>店舗数: {region.store_count}店</p>
                          <p>平均支払い: ¥{region.average_payment_amount?.toLocaleString()}</p>
                          <p>顧客数: {region.unique_customers}人</p>
                          <p>平均ポイント: {region.average_points_used}pt</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 人気商品 */}
            {selectedTab === 'products' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Flower className="h-5 w-5 mr-2 text-pink-500" />
                      人気商品ランキング
                    </h2>
                    <select
                      value={selectedPrefecture}
                      onChange={(e) => handlePrefectureChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {prefectures.map(pref => (
                        <option key={pref} value={pref}>{pref}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    {rankings.regionalProducts.map((product, index) => (
                      <div key={product.flower_category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{product.flower_category}</h3>
                            <p className="text-sm text-gray-500">販売回数: {product.popularity_count}回</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">¥{product.average_price?.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">平均価格</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ポイント使用 */}
            {selectedTab === 'points' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Gift className="h-5 w-5 mr-2 text-green-500" />
                    ポイント使用ランキング
                  </h2>
                  <div className="space-y-3">
                    {rankings.points.map((point, index) => (
                      <div key={point.points_range} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{point.points_range}</h3>
                            <p className="text-sm text-gray-500">使用回数: {point.usage_count}回</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{point.points_usage_percentage}%</p>
                          <p className="text-sm text-gray-500">使用率</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 季節トレンド */}
            {selectedTab === 'seasonal' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                    季節別トレンド（直近1年）
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {rankings.seasonal.map((trend) => (
                      <div key={trend.month} className="bg-gray-50 rounded-lg p-4">
                        <div className="text-center">
                          <h3 className="font-medium text-gray-900">{trend.month}月</h3>
                          <p className="text-sm text-gray-500 mb-2">{trend.season}</p>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>決済回数: {trend.payment_count}回</p>
                            <p>平均金額: ¥{trend.average_payment_amount?.toLocaleString()}</p>
                            <p>顧客数: {trend.unique_customers}人</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 決済方法 */}
            {selectedTab === 'payment' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                    決済方法別トレンド
                  </h2>
                  <div className="space-y-3">
                    {rankings.payment.map((method, index) => (
                      <div key={method.payment_method} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {method.payment_method === 'stripe_connect' ? 'クレジットカード' : '現金'}
                            </h3>
                            <p className="text-sm text-gray-500">使用回数: {method.usage_count}回</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{method.usage_percentage}%</p>
                          <p className="text-sm text-gray-500">使用率</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PublicRankings;
