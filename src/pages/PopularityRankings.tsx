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
  RefreshCw
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
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState<{
    pointsUsed: RankingData[];
    remainingPoints: RankingData[];
    averageSales: RankingData[];
    totalSales: RankingData[];
    purchaseCount: RankingData[];
  }>({
    pointsUsed: [],
    remainingPoints: [],
    averageSales: [],
    totalSales: [],
    purchaseCount: []
  });

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
      
      // ポイント使用ランキング
      const { data: pointsUsedData } = await supabase
        .from('monthly_points_used_ranking')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .lte('rank', 10);

      // 残ポイントランキング
      const { data: remainingPointsData } = await supabase
        .from('current_points_ranking')
        .select('*')
        .lte('rank', 10);

      // 平均売上ランキング
      const { data: averageSalesData } = await supabase
        .from('monthly_avg_sales_ranking')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .lte('rank', 10);

      // 総売上ランキング
      const { data: totalSalesData } = await supabase
        .from('monthly_sales_ranking')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .lte('rank', 10);

      // 購入回数ランキング
      const { data: purchaseCountData } = await supabase
        .from('monthly_purchase_count_ranking')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .lte('rank', 10);

      // データを整形
      setRankings({
        pointsUsed: formatRankingDataFromView(pointsUsedData || [], 'total_points_used'),
        remainingPoints: formatRankingDataFromView(remainingPointsData || [], 'total_points'),
        averageSales: formatRankingDataFromView(averageSalesData || [], 'avg_sales'),
        totalSales: formatRankingDataFromView(totalSalesData || [], 'total_sales'),
        purchaseCount: formatRankingDataFromView(purchaseCountData || [], 'purchase_count')
      });

    } catch (error) {
      console.error('ランキング読み込みエラー:', error);
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
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/simple-menu')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">人気ランキング</h1>
                <p className="text-sm text-gray-500">全国の購入データを元にした月次ランキング</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => loadRankings()}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 transition-colors duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                更新
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 月選択 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
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
        </div>

        {/* ランキンググリッド */}
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
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-yellow-500" />
            統計サマリー
          </h3>
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
        </div>
      </div>
    </div>
  );
};

export default PopularityRankings;
