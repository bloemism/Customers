import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  MapPin,
  CreditCard
} from 'lucide-react';

export const Menu: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    {
      title: '商品管理',
      description: '商品の追加・編集・在庫管理',
      icon: Package,
      href: '/products',
      color: 'bg-green-500'
    },
    {
      title: 'お客様会計',
      description: '品目入力、合計計算、ポイント管理、QRコード生成',
      icon: ShoppingCart,
      href: '/checkout',
      color: 'bg-blue-500'
    },
    {
      title: '顧客管理',
      description: '顧客検索、購入履歴、ポイント管理',
      icon: Users,
      href: '/customers',
      color: 'bg-purple-500'
    },
    {
      title: '店舗データ管理',
      description: '店舗情報登録・編集、営業時間、サービス、写真',
      icon: Store,
      href: '/store-registration',
      color: 'bg-indigo-500'
    },
    {
      title: '全国フローリストマップ',
      description: '店舗検索、詳細表示、掲示板機能',
      icon: MapPin,
      href: '/florist-map',
      color: 'bg-orange-500'
    },
    {
      title: '売上分析',
      description: '売上データの分析・レポート',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-red-500'
    },
    {
      title: 'QR決済',
      description: 'QRコード決済の管理',
      icon: CreditCard,
      href: '/qr-payment',
      color: 'bg-yellow-500'
    },
    {
      title: '設定',
      description: 'アプリケーション設定',
      icon: Settings,
      href: '/settings',
      color: 'bg-gray-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">87花屋 管理画面</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">{user?.email || '開発モード'}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">メニュー</h2>
          <p className="text-gray-600">店舗管理に必要な機能を選択してください</p>
        </div>

        {/* メニューグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = item.href}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${item.color} text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 開発モード通知 */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">開発モード</h3>
              <p className="text-sm text-yellow-700 mt-1">
                現在は開発モードで動作しています。実際の機能を使用するには、Supabaseプロジェクトを設定してください。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
