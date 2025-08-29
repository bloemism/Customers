import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Flower, Calendar, MapPin } from 'lucide-react';

interface FlowerRanking {
  id: string;
  name: string;
  region: string;
  popularity: number;
  image?: string;
  description?: string;
  price_range: string;
}

const RankingPage: React.FC = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<FlowerRanking[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [loading, setLoading] = useState(true);

  // サンプルデータ（実際のアプリではAPIから取得）
  useEffect(() => {
    const sampleRankings: FlowerRanking[] = [
      {
        id: '1',
        name: 'バラ',
        region: '関東',
        popularity: 95,
        description: '愛と美の象徴として人気の高い花',
        price_range: '¥1,000-¥5,000'
      },
      {
        id: '2',
        name: 'チューリップ',
        region: '関東',
        popularity: 88,
        description: '春を代表する花として親しまれています',
        price_range: '¥800-¥3,000'
      },
      {
        id: '3',
        name: 'ひまわり',
        region: '関東',
        popularity: 82,
        description: '夏の太陽のような明るい花',
        price_range: '¥500-¥2,500'
      },
      {
        id: '4',
        name: 'ユリ',
        region: '関西',
        popularity: 78,
        description: '上品で美しい花として人気',
        price_range: '¥1,200-¥4,000'
      },
      {
        id: '5',
        name: 'カーネーション',
        region: '関西',
        popularity: 75,
        description: '母の日の定番として親しまれています',
        price_range: '¥600-¥2,800'
      }
    ];

    setRankings(sampleRankings);
    setLoading(false);
  }, []);

  const regions = [
    { value: 'all', label: '全国' },
    { value: 'kanto', label: '関東' },
    { value: 'kansai', label: '関西' },
    { value: 'chubu', label: '中部' },
    { value: 'kyushu', label: '九州' }
  ];

  const months = [
    { value: 'current', label: '今月' },
    { value: 'last', label: '先月' },
    { value: 'next', label: '来月' }
  ];

  const filteredRankings = rankings.filter(ranking => {
    if (selectedRegion !== 'all' && ranking.region !== selectedRegion) {
      return false;
    }
    return true;
  });

  const sortedRankings = [...filteredRankings].sort((a, b) => b.popularity - a.popularity);

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
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">人気ランキング</h1>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地域
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {regions.map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                期間
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ランキングリスト */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">花の人気ランキング</h2>
            <p className="text-sm text-gray-600 mt-1">
              地域別・月別の人気花ランキング
            </p>
          </div>

          {sortedRankings.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">該当するランキングがありません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedRankings.map((flower, index) => (
                <div key={flower.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* ランキング番号 */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    {/* 花の情報 */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{flower.name}</h3>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{flower.region}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-2">{flower.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              人気度: {flower.popularity}%
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            価格帯: {flower.price_range}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ランキングについて */}
        <div className="mt-6 bg-red-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">ランキングについて</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-red-800 mb-2">ランキング基準</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 全国の加盟店舗での販売データ</li>
                <li>• 顧客の購入履歴と評価</li>
                <li>• 季節性と地域性を考慮</li>
                <li>• 月次で更新されます</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-800 mb-2">ご利用について</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 花選びの参考にご活用ください</li>
                <li>• 地域により価格が異なります</li>
                <li>• 在庫状況は店舗にお問い合わせください</li>
                <li>• 季節の花を楽しんでください</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingPage;
