import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { 
  ShoppingCart, 
  MapPin, 
  Users, 
  Store, 
  LogOut, 
  Flower,
  Receipt,
  Map,
  UserCheck,
  Settings,
  BookOpen,
  Calendar,
  GraduationCap,
  TrendingUp
} from 'lucide-react';

export const SimpleMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useSimpleAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/simple-login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const menuItems = [
    {
      id: 'checkout',
      title: 'お客様会計',
      description: '品目自動変換・ポイント管理・QR決済',
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-600',
      route: '/checkout'
    },
    {
      id: 'product-management',
      title: '商品管理',
      description: '品目・色・価格の管理',
      icon: Flower,
      color: 'from-pink-500 to-rose-600',
      route: '/product-management'
    },
    {
      id: 'florist-map',
      title: '全国フローリストマップ',
      description: 'GPS位置情報で花屋を検索',
      icon: MapPin,
      color: 'from-blue-500 to-cyan-600',
      route: '/florist-map'
    },
    {
      id: 'customer-management',
      title: '顧客管理',
      description: 'お客様データ・ポイント・販売履歴',
      icon: Users,
      color: 'from-purple-500 to-indigo-600',
      route: '/customer-management'
    },
    {
      id: 'store-management',
      title: '店舗データ管理',
      description: 'GPS位置・店舗情報のカスタマイズ',
      icon: Store,
      color: 'from-orange-500 to-red-600',
      route: '/store-registration'
    },
    {
      id: 'flower-lesson-map',
      title: 'フラワーレッスンマップ',
      description: '全国のフラワーレッスンスクールを探す',
      icon: BookOpen,
      color: 'from-pink-500 to-rose-600',
      route: '/flower-lesson-map'
    },
    {
      id: 'lesson-school-management',
      title: 'レッスンスクール管理',
      description: 'フラワーレッスンスクールの情報を管理',
      icon: GraduationCap,
      color: 'from-teal-500 to-cyan-600',
      route: '/lesson-school-management'
    },
    {
      id: 'lesson-schedule-management',
      title: 'レッスンスケジュール管理',
      description: 'レッスンのスケジュールと生徒予約を管理',
      icon: Calendar,
      color: 'from-cyan-500 to-blue-600',
      route: '/lesson-schedule-management'
    },
    {
      id: 'popularity-rankings',
      title: '人気ランキング',
      description: '全国の購入データを元にした月次ランキング',
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-600',
      route: '/popularity-rankings'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Flower className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">87app</h1>
                <p className="text-sm text-gray-500">花屋向け店舗管理システム</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.email || 'ユーザー'}
                </p>
                <p className="text-xs text-gray-500">店舗管理者</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="ログアウト"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* シンプルなタイトル */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            87app メニュー
          </h2>
        </div>

        {/* メニューグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
              >
                {/* グラデーション背景 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative p-8 text-left">
                  {/* アイコン */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  
                  {/* タイトル */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-200">
                    {item.title}
                  </h3>
                  
                  {/* 説明 */}
                  <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-200">
                    {item.description}
                  </p>
                  
                  {/* 矢印アイコン */}
                  <div className="absolute top-6 right-6 text-gray-300 group-hover:text-gray-400 transition-colors duration-200">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* クイックアクション */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-green-500" />
              クイックアクション
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/florist-map')}
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Map className="h-6 w-6 text-blue-500 mb-2" />
                <span className="text-sm text-gray-600">地図表示</span>
              </button>
              <button 
                onClick={() => navigate('/customer-management')}
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <UserCheck className="h-6 w-6 text-purple-500 mb-2" />
                <span className="text-sm text-gray-600">顧客検索</span>
              </button>
              <button 
                onClick={() => navigate('/product-management')}
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Flower className="h-6 w-6 text-pink-500 mb-2" />
                <span className="text-sm text-gray-600">商品管理</span>
              </button>
              <button className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <Settings className="h-6 w-6 text-orange-500 mb-2" />
                <span className="text-sm text-gray-600">設定</span>
              </button>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>© 2024 87app. 花屋向け店舗管理システム</p>
        </div>
      </div>
    </div>
  );
};