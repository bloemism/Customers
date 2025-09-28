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
  Settings
} from 'lucide-react';

export const MenuScreen: React.FC = () => {
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
      description: '品目を入力して会計処理',
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-600',
      route: '/checkout'
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
    }
  ];

  const quickActions = [
    {
      id: 'map',
      title: '地図表示',
      icon: Map,
      color: 'text-blue-500',
      route: '/florist-map'
    },
    {
      id: 'customer-search',
      title: '顧客検索',
      icon: UserCheck,
      color: 'text-purple-500',
      route: '/customer-management'
    },
    {
      id: 'settings',
      title: '設定',
      icon: Settings,
      color: 'text-orange-500',
      route: '/settings'
    },
    {
      id: 'product-management',
      title: '商品管理',
      icon: Flower,
      color: 'text-pink-500',
      route: '/product-management'
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* メインメニュー - モバイル対応の横バー形式 */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">メインメニュー</h2>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className="group w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 overflow-hidden"
              >
                <div className="flex items-center p-4">
                  {/* コンテンツ */}
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200 mt-1">
                      {item.description}
                    </p>
                  </div>
                  
                  {/* 矢印アイコン */}
                  <div className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* クイックアクション - モバイル対応の横バー形式 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">クイックアクション</h2>
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => navigate(action.route)}
                className="group w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 overflow-hidden"
              >
                <div className="flex items-center p-4">
                  {/* コンテンツ */}
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-200">
                      {action.title}
                    </h3>
                  </div>
                  
                  {/* 矢印アイコン */}
                  <div className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* フッター */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>© 2024 87app. 花屋向け店舗管理システム</p>
        </div>
      </div>
    </div>
  );
};

