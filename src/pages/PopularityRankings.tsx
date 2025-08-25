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
  Flower
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RankingData {
  rank: number;
  name: string;
  value: number;
  store_address: string;
  store_name: string;
  change: 'up' | 'down' | 'stable';
}

interface RegionRanking {
  region: string;
  rankings: RankingData[];
}

const PopularityRankings: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState<{
    pointsUsed: RankingData[];
    remainingPoints: RankingData[];
    averageSales: RankingData[];
    totalSales: RankingData[];
    purchaseCount: RankingData[];
    regionalRankings: { [region: string]: RankingData[] };
    popularFlowers: RankingData[];
  }>({
    pointsUsed: [],
    remainingPoints: [],
    averageSales: [],
    totalSales: [],
    purchaseCount: [],
    regionalRankings: {},
    popularFlowers: []
  });

  const [error, setError] = useState<string | null>(null);

  // 現在の年月を取得
  function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // 月を変更
  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month;

    if (direction === 'prev') {
      if (month === 1) {
        newMonth = 12;
        newYear = year - 1;
      } else {
        newMonth = month - 1;
      }
    } else {
      if (month === 12) {
        newMonth = 1;
        newYear = year + 1;
      } else {
        newMonth = month + 1;
      }
    }

    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  // ランキングデータを読み込み
  const loadRankings = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      
      console.log('ランキング読み込み開始:', { year, month });
      
      // ポイント使用ランキング
      const { data: pointsUsedData, error: pointsError } = await supabase
        .from('monthly_points_used_ranking')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .lte('rank', 10);

      if (pointsError) {
        console.error('ポイント使用ランキングエラー:', pointsError);
      } else {
        console.log('ポイント使用ランキングデータ:', pointsUsedData);
      }

      // 残ポイントランキング
      const { data: remainingPointsData, error: remainingError } = await supabase
        .from('current_points_ranking')
        .select('*')
        .lte('rank', 10);

      if (remainingError) {
        console.error('残ポイントランキングエラー:', remainingError);
      } else {
        console.log('残ポイントランキングデータ:', remainingPointsData);
      }

      // 平均売上ランキング
      const { data: averageSalesData, error: avgError } = await supabase
        .from('monthly_avg_sales_ranking')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .lte('rank', 10);

      if (avgError) {
        console.error('平均売上ランキングエラー:', avgError);
      } else {
        console.log('平均売上ランキングデータ:', averageSalesData);
      }

      // 総売上ランキング
      const { data: totalSalesData, error: totalError } = await supabase
        .from('monthly_sales_ranking')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .lte('rank', 10);

      if (totalError) {
        console.error('総売上ランキングエラー:', totalError);
      } else {
        console.log('総売上ランキングデータ:', totalSalesData);
      }

      // 購入回数ランキング
      const { data: purchaseCountData, error: countError } = await supabase
        .from('monthly_purchase_count_ranking')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .lte('rank', 10);

      if (countError) {
        console.error('購入回数ランキングエラー:', countError);
      } else {
        console.log('購入回数ランキングデータ:', purchaseCountData);
      }

      // 地域別ランキングを取得
      const { data: regionData } = await supabase
        .from('region_categories')
        .select('*')
        .order('display_order');

      const regionalRankings: { [region: string]: RankingData[] } = {};
      
      if (regionData) {
        for (const region of regionData) {
          // 各地域の売上ランキング（サンプルデータ）
          regionalRankings[region.name] = [
            { rank: 1, name: 'サンプル店舗1', value: 150000, store_address: region.prefectures[0], store_name: `${region.name}店舗1`, change: 'up' as const },
            { rank: 2, name: 'サンプル店舗2', value: 120000, store_address: region.prefectures[1], store_name: `${region.name}店舗2`, change: 'stable' as const },
            { rank: 3, name: 'サンプル店舗3', value: 100000, store_address: region.prefectures[2], store_name: `${region.name}店舗3`, change: 'down' as const }
          ];
        }
      }

      // 人気の花ランキング（サンプルデータ）
      const popularFlowers = [
        { rank: 1, name: 'バラ', value: 250, store_address: '全国', store_name: '人気No.1', change: 'up' as const },
        { rank: 2, name: 'チューリップ', value: 180, store_address: '全国', store_name: '人気No.2', change: 'up' as const },
        { rank: 3, name: 'カーネーション', value: 150, store_address: '全国', store_name: '人気No.3', change: 'stable' as const },
        { rank: 4, name: 'ひまわり', value: 120, store_address: '全国', store_name: '人気No.4', change: 'down' as const },
        { rank: 5, name: 'ユリ', value: 100, store_address: '全国', store_name: '人気No.5', change: 'up' as const }
      ];

      // データを整形
      setRankings({
        pointsUsed: formatRankingDataFromView(pointsUsedData || [], 'total_points_used'),
        remainingPoints: formatRankingDataFromView(remainingPointsData || [], 'total_points'),
        averageSales: formatRankingDataFromView(averageSalesData || [], 'avg_sales'),
        totalSales: formatRankingDataFromView(totalSalesData || [], 'total_sales'),
        purchaseCount: formatRankingDataFromView(purchaseCountData || [], 'purchase_count'),
        regionalRankings,
        popularFlowers
      });

    } catch (error) {
      console.error('ランキング読み込みエラー:', error);
      setError('データの読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 次の月を取得
  function getNextMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-').map(Number);
    if (month === 12) {
      return `${year + 1}-01`;
    }
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  // ランキングデータを整形（ビュー用）
  const formatRankingDataFromView = (data: any[], valueField: string): RankingData[] => {
    return data.map((item) => ({
      rank: item.rank || 1,
      name: item.customer_name || '不明',
      value: item[valueField] || 0,
      store_address: item.customer_email || '不明',
      store_name: item.customer_email || '不明',
      change: 'stable' as const
    }));
  };

  // 月が変更されたらランキングを再読み込み
  useEffect(() => {
    loadRankings();
  }, [selectedMonth]);

  // ランキングカードコンポーネント
  const RankingCard = ({ title, icon: Icon, data, valueFormatter, color }: {
    title: string;
    icon: any;
    data: RankingData[];
    valueFormatter: (value: number) => string;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Icon className={`w-5 h-5 mr-2 ${color}`} />
          {title}
        </h3>
        <span className="text-sm text-gray-500">Top 10</span>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>データがありません</p>
          <p className="text-sm mt-2">顧客データや購入履歴が追加されると、ここにランキングが表示されます</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  item.rank === 1 ? 'bg-yellow-500 text-white' :
                  item.rank === 2 ? 'bg-gray-400 text-white' :
                  item.rank === 3 ? 'bg-orange-500 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {item.rank}
                </div>
                                 <div>
                   <div className="font-medium text-gray-900">{item.name}</div>
                   <div className="text-sm text-gray-500">{item.store_name} ({item.store_address})</div>
                 </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{valueFormatter(item.value)}</div>
                <div className="text-xs text-gray-500">#{item.rank}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* デバッグ情報 */}
      <div className="fixed top-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-3 text-sm z-50">
        <div>ページ状態: 正常</div>
        <div>選択月: {selectedMonth}</div>
        <div>ローディング: {loading ? 'はい' : 'いいえ'}</div>
      </div>
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/simple-menu')}
                className="p-2 text-white hover:text-yellow-100 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">人気ランキング</h1>
                <p className="text-sm text-yellow-100">全国の購入データを元にした月次ランキング</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => loadRankings()}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-600 bg-white hover:bg-yellow-50 disabled:opacity-50 transition-colors duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                更新
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-red-400">⚠️</div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 月選択・地域選択 */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 月選択 */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => changeMonth('prev')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ←
              </button>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-semibold text-gray-900">
                  {selectedMonth.split('-')[0]}年{selectedMonth.split('-')[1]}月
                </span>
              </div>
              <button
                onClick={() => changeMonth('next')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                →
              </button>
            </div>

            {/* 地域選択 */}
            <div className="flex items-center justify-center space-x-4">
              <MapPin className="w-5 h-5 text-blue-500" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全国</option>
                <option value="北海道・東北">北海道・東北</option>
                <option value="関東甲信越">関東甲信越</option>
                <option value="中部">中部</option>
                <option value="関西">関西</option>
                <option value="中国・四国">中国・四国</option>
                <option value="九州・沖縄">九州・沖縄</option>
              </select>
            </div>
          </div>
        </div>

        {/* 人気の花ランキング */}
        <div className="mb-8">
          <RankingCard
            title="人気の花ランキング"
            icon={Flower}
            data={rankings.popularFlowers}
            valueFormatter={(value) => `${value}本`}
            color="text-pink-500"
          />
        </div>

        {/* 地域別ランキング */}
        {selectedRegion !== 'all' && rankings.regionalRankings[selectedRegion] && (
          <div className="mb-8">
            <RankingCard
              title={`${selectedRegion}地域ランキング`}
              icon={MapPin}
              data={rankings.regionalRankings[selectedRegion]}
              valueFormatter={(value) => `¥${value.toLocaleString()}`}
              color="text-blue-500"
            />
          </div>
        )}

        {/* 全国ランキンググリッド */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ポイント使用ランキング */}
          <RankingCard
            title="ポイント使用ランキング"
            icon={Gift}
            data={rankings.pointsUsed}
            valueFormatter={(value) => `${value}pt`}
            color="text-purple-500"
          />

          {/* 残ポイントランキング */}
          <RankingCard
            title="残ポイントランキング"
            icon={Gift}
            data={rankings.remainingPoints}
            valueFormatter={(value) => `${value}pt`}
            color="text-green-500"
          />

          {/* 平均売上ランキング */}
          <RankingCard
            title="平均売上ランキング"
            icon={DollarSign}
            data={rankings.averageSales}
            valueFormatter={(value) => `¥${value.toLocaleString()}`}
            color="text-blue-500"
          />

          {/* 総売上ランキング */}
          <RankingCard
            title="総売上ランキング"
            icon={TrendingUp}
            data={rankings.totalSales}
            valueFormatter={(value) => `¥${value.toLocaleString()}`}
            color="text-orange-500"
          />

          {/* 購入回数ランキング */}
          <RankingCard
            title="購入回数ランキング"
            icon={ShoppingCart}
            data={rankings.purchaseCount}
            valueFormatter={(value) => `${value}回`}
            color="text-indigo-500"
          />
        </div>

        {/* 統計サマリー */}
        <div className="mt-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-yellow-500" />
            統計サマリー
          </h3>
          {rankings.pointsUsed.length === 0 && rankings.remainingPoints.length === 0 && 
           rankings.averageSales.length === 0 && rankings.totalSales.length === 0 && 
           rankings.purchaseCount.length === 0 && rankings.popularFlowers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>ランキングデータがありません</p>
              <p className="text-sm mt-2">顧客データや購入履歴を追加してください</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {rankings.pointsUsed.length > 0 ? rankings.pointsUsed[0].value : 0}
              </div>
              <div className="text-sm text-gray-500">最高ポイント使用</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rankings.remainingPoints.length > 0 ? rankings.remainingPoints[0].value : 0}
              </div>
              <div className="text-sm text-gray-500">最高残ポイント</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ¥{rankings.averageSales.length > 0 ? rankings.averageSales[0].value.toLocaleString() : 0}
              </div>
              <div className="text-sm text-gray-500">最高平均売上</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ¥{rankings.totalSales.length > 0 ? rankings.totalSales[0].value.toLocaleString() : 0}
              </div>
              <div className="text-sm text-gray-500">最高総売上</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {rankings.purchaseCount.length > 0 ? rankings.purchaseCount[0].value : 0}
              </div>
              <div className="text-sm text-gray-500">最高購入回数</div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopularityRankings;
