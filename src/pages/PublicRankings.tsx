import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Gift,
  MapPin,
  RefreshCw,
  Flower,
  CreditCard
} from 'lucide-react';
import { PublicRankingService } from '../services/publicRankingService';
import type {
  RegionalStatistics,
  ProductPopularity,
  PointsUsageStats,
  SeasonalTrends,
  PaymentMethodTrends
} from '../services/publicRankingService';

const COLORS = {
  bg: '#FAF8F5',
  header: 'rgba(92,107,74,0.95)',
  text: '#2D2A26',
  textMuted: '#8A857E',
  border: '#E0D6C8',
  accent: '#5C6B4A',
  cardBg: 'rgba(255,255,255,0.95)'
};

const PublicRankings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'regional' | 'products' | 'points' | 'seasonal' | 'payment'>('regional');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('東京都');
  const [pointMonthTab, setPointMonthTab] = useState<'prev2' | 'prev1' | 'current' | 'all'>('all');
  const [regionalPoints, setRegionalPoints] = useState<{ prefecture: string; total_points: number }[]>([]);

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
      setRankings(prev => ({ ...prev, regional, products, points, seasonal, payment }));
    } catch (err) {
      console.error('ランキングデータ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadRegionalProducts = async (prefecture: string) => {
    try {
      const regionalProducts = await PublicRankingService.getRegionalProductRanking(prefecture);
      setRankings(prev => ({ ...prev, regionalProducts }));
    } catch (err) {
      console.error('地域別商品ランキング取得エラー:', err);
    }
  };

  const loadRegionalPoints = async () => {
    const now = new Date();
    let key = 'all';
    if (pointMonthTab === 'current') {
      key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else if (pointMonthTab === 'prev1') {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else if (pointMonthTab === 'prev2') {
      const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const data = await PublicRankingService.getMonthlyRegionalPointsRanking(key);
    setRegionalPoints(data);
  };

  const handlePrefectureChange = (prefecture: string) => {
    setSelectedPrefecture(prefecture);
    loadRegionalProducts(prefecture);
  };

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

  useEffect(() => {
    if (selectedTab === 'points') loadRegionalPoints();
  }, [selectedTab, pointMonthTab]);

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
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="border-b" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded transition-colors"
                style={{ color: COLORS.textMuted }}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="px-5 py-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: COLORS.header, color: '#fff' }}>
                <Trophy className="h-5 w-5" style={{ color: '#fef08a' }} />
                <h1 className="text-lg font-bold" style={{ color: '#fff' }}>人気ランキング</h1>
              </div>
            </div>
            <button
              onClick={loadRankings}
              disabled={loading}
              className="flex items-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: COLORS.accent, color: '#fff' }}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="border-b" style={{ borderColor: COLORS.border }}>
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as 'regional' | 'products' | 'points' | 'seasonal' | 'payment')}
                    className="flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors"
                    style={{
                      borderColor: active ? COLORS.accent : 'transparent',
                      color: active ? COLORS.accent : COLORS.textMuted
                    }}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
            <p style={{ color: '#B91C1C' }}>{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="rounded-full h-12 w-12 border-2 animate-spin" style={{ borderColor: COLORS.border, borderTopColor: COLORS.accent }} />
          </div>
        )}

        {/* コンテンツ */}
        {!loading && (
          <>
            {selectedTab === 'regional' && (
              <div className="space-y-6">
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
                  <div className="px-5 py-4" style={{ backgroundColor: COLORS.header, color: '#fff' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: '#fff' }}>🗾 地域別加盟店</h2>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      全国 {rankings.regional.reduce((sum, r) => sum + (r.store_count || 0), 0)} 店舗の分布
                    </p>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.text }}>
                      <MapPin className="h-5 w-5" style={{ color: COLORS.accent }} />
                      地域別統計（直近30日）
                    </h2>
                    {rankings.regional.length === 0 ? (
                      <div className="text-center py-12" style={{ color: COLORS.textMuted }}>
                        <MapPin className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.border }} />
                        <p className="font-medium">地域別のランキングデータがありません</p>
                        <p className="text-sm mt-2">購入データが追加されると表示されます</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rankings.regional.map((region, index) => (
                          <div key={region.prefecture} className="rounded-lg p-4" style={{ backgroundColor: '#F5F0E8', border: `1px solid ${COLORS.border}` }}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium" style={{ color: COLORS.text }}>{region.prefecture}</h3>
                              <span className="text-sm" style={{ color: COLORS.textMuted }}>#{index + 1}</span>
                            </div>
                            <div className="space-y-1 text-sm" style={{ color: COLORS.text }}>
                              <p>店舗数: {region.store_count}店</p>
                              <p>平均支払い: ¥{region.average_payment_amount?.toLocaleString()}</p>
                              <p>顧客数: {region.unique_customers}人</p>
                              <p>平均ポイント: {region.average_points_used}pt</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'products' && (
              <div className="space-y-6">
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
                  <div className="px-5 py-4" style={{ backgroundColor: COLORS.header, color: '#fff' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: '#fff' }}>🌸 人気のお花ランキング</h2>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>購入データに基づく人気ランキング</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <select
                        value={selectedPrefecture}
                        onChange={(e) => handlePrefectureChange(e.target.value)}
                        className="px-3 py-2 rounded-lg focus:outline-none"
                        style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                      >
                        {prefectures.map(pref => (
                          <option key={pref} value={pref}>{pref}</option>
                        ))}
                      </select>
                    </div>
                    {rankings.regionalProducts.length === 0 ? (
                      <div className="text-center py-12" style={{ color: COLORS.textMuted }}>
                        <Flower className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.border }} />
                        <p className="font-medium">人気商品のランキングデータがありません</p>
                        <p className="text-sm mt-2">購入データが追加されると表示されます</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rankings.regionalProducts.map((product, index) => (
                          <div key={product.flower_category} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#F5F0E8', border: `1px solid ${COLORS.border}` }}>
                            <div className="flex items-center">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3" style={{ backgroundColor: COLORS.accent, color: '#fff' }}>
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-medium" style={{ color: COLORS.text }}>{product.flower_category}</h3>
                                <p className="text-sm" style={{ color: COLORS.textMuted }}>販売回数: {product.popularity_count}回</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium" style={{ color: COLORS.text }}>¥{product.average_price?.toLocaleString()}</p>
                              <p className="text-sm" style={{ color: COLORS.textMuted }}>平均価格</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'points' && (
              <div className="space-y-6">
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
                  <div className="px-5 py-4" style={{ backgroundColor: COLORS.header, color: '#fff' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: '#fff' }}>📍 県別ポイントランキング</h2>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>地域のポイント総合計（名前は表示しません）</p>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(['prev2', 'prev1', 'current', 'all'] as const).map((tab) => {
                        const labels = { prev2: '先々月', prev1: '先月', current: '今月', all: '合計' };
                        const active = pointMonthTab === tab;
                        return (
                          <button
                            key={tab}
                            onClick={() => setPointMonthTab(tab)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: active ? COLORS.accent : '#F5F0E8',
                              color: active ? '#fff' : COLORS.text
                            }}
                          >
                            {labels[tab]}
                          </button>
                        );
                      })}
                    </div>
                    {regionalPoints.length === 0 ? (
                      <div className="text-center py-12" style={{ color: COLORS.textMuted }}>
                        <Gift className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.border }} />
                        <p className="font-medium">県別ポイントのデータがありません</p>
                        <p className="text-sm mt-2">ポイント利用データが追加されると表示されます</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {regionalPoints.map((row, index) => (
                          <div key={row.prefecture} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#F5F0E8', border: `1px solid ${COLORS.border}` }}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍'}
                              </span>
                              <span className="font-medium" style={{ color: COLORS.text }}>{row.prefecture}</span>
                            </div>
                            <span className="font-semibold" style={{ color: COLORS.accent }}>{Number(row.total_points || 0).toLocaleString()} pt</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden p-6" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.text }}>
                    <Gift className="h-5 w-5" style={{ color: COLORS.accent }} />
                    ポイント使用ランキング
                  </h2>
                  {rankings.points.length === 0 ? (
                    <div className="text-center py-8" style={{ color: COLORS.textMuted }}>
                      <p className="font-medium">ポイント使用ランキングデータがありません</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rankings.points.map((point, index) => (
                        <div key={point.points_range} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#F5F0E8', border: `1px solid ${COLORS.border}` }}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ backgroundColor: COLORS.accent, color: '#fff' }}>{index + 1}</div>
                            <div>
                              <h3 className="font-medium" style={{ color: COLORS.text }}>{point.points_range}</h3>
                              <p className="text-sm" style={{ color: COLORS.textMuted }}>使用回数: {point.usage_count}回</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium" style={{ color: COLORS.text }}>{point.points_usage_percentage}%</p>
                            <p className="text-sm" style={{ color: COLORS.textMuted }}>使用率</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'seasonal' && (
              <div className="space-y-6">
                <div className="rounded-lg p-6" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.text }}>
                    <Calendar className="h-5 w-5" style={{ color: COLORS.accent }} />
                    季節別トレンド（直近1年）
                  </h2>
                  {rankings.seasonal.length === 0 ? (
                    <div className="text-center py-12" style={{ color: COLORS.textMuted }}>
                      <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.border }} />
                      <p className="font-medium">季節トレンドのデータがありません</p>
                      <p className="text-sm mt-2">決済データが追加されると表示されます</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {rankings.seasonal.map((trend) => (
                        <div key={trend.month} className="rounded-lg p-4" style={{ backgroundColor: '#F5F0E8', border: `1px solid ${COLORS.border}` }}>
                          <div className="text-center">
                            <h3 className="font-medium" style={{ color: COLORS.text }}>{trend.month}月</h3>
                            <p className="text-sm mb-2" style={{ color: COLORS.textMuted }}>{trend.season}</p>
                            <div className="space-y-1 text-sm" style={{ color: COLORS.text }}>
                              <p>決済回数: {trend.payment_count}回</p>
                              <p>平均金額: ¥{trend.average_payment_amount?.toLocaleString()}</p>
                              <p>顧客数: {trend.unique_customers}人</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'payment' && (
              <div className="space-y-6">
                <div className="rounded-lg p-6" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.text }}>
                    <CreditCard className="h-5 w-5" style={{ color: COLORS.accent }} />
                    決済方法別トレンド
                  </h2>
                  {rankings.payment.length === 0 ? (
                    <div className="text-center py-12" style={{ color: COLORS.textMuted }}>
                      <CreditCard className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.border }} />
                      <p className="font-medium">決済方法のデータがありません</p>
                      <p className="text-sm mt-2">決済データが追加されると表示されます</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rankings.payment.map((method, index) => (
                        <div key={method.payment_method} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#F5F0E8', border: `1px solid ${COLORS.border}` }}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ backgroundColor: COLORS.accent, color: '#fff' }}>{index + 1}</div>
                            <div>
                              <h3 className="font-medium" style={{ color: COLORS.text }}>
                                {method.payment_method === 'stripe_connect' ? 'クレジットカード' : '現金'}
                              </h3>
                              <p className="text-sm" style={{ color: COLORS.textMuted }}>使用回数: {method.usage_count}回</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium" style={{ color: COLORS.text }}>{method.usage_percentage}%</p>
                            <p className="text-sm" style={{ color: COLORS.textMuted }}>使用率</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
