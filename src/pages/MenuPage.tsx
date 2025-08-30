import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MapPin, 
  BookOpen, 
  Calendar, 
  User, 
  QrCode, 
  LogOut, 
  Flower,
  Receipt,
  TrendingUp, 
  CreditCard, 
  History
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const menuItems = [
    {
      id: 'florist-map',
      title: '全国フローリストマップ',
      description: 'GPS位置情報で花屋を検索',
      icon: MapPin,
      color: 'from-blue-500 to-cyan-600',
      route: '/florist-map',
      enabled: true
    },
    {
      id: 'qr-code',
      title: 'QRコード・ポイント',
      description: 'QRコード表示・ポイント残高',
      icon: QrCode,
      color: 'from-orange-500 to-red-600',
      route: '/qr-code',
      enabled: true
    },
    {
      id: 'payment',
      title: '決済',
      description: '現金・クレジット決済',
      icon: CreditCard,
      color: 'from-teal-500 to-cyan-600',
      route: '/payment',
      enabled: true
    },
    {
      id: 'lesson-map',
      title: 'フラワーレッスンマップ',
      description: '全国のフラワーレッスンスクールを探す',
      icon: BookOpen,
      color: 'from-pink-500 to-rose-600',
      route: '/lesson-map',
      enabled: false
    },
    {
      id: 'lesson-schedule',
      title: 'レッスンスケジュール',
      description: 'レッスンの予約・確認',
      icon: Calendar,
      color: 'from-green-500 to-emerald-600',
      route: '/lesson-schedule',
      enabled: false
    },
    {
      id: 'profile',
      title: 'マイプロフィール',
      description: '顧客情報・ポイント確認',
      icon: User,
      color: 'from-purple-500 to-indigo-600',
      route: '/profile',
      enabled: false
    },
    {
      id: 'point-history',
      title: 'ポイント履歴',
      description: 'ポイント獲得・使用履歴',
      icon: Receipt,
      color: 'from-yellow-500 to-orange-600',
      route: '/point-history',
      enabled: false
    },
    {
      id: 'payment-history',
      title: '決済履歴',
      description: '過去の決済履歴',
      icon: History,
      color: 'from-gray-500 to-slate-600',
      route: '/payment-history',
      enabled: false
    },
    {
      id: 'ranking',
      title: '人気ランキング',
      description: '花屋・商品の人気ランキング',
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-600',
      route: '/ranking',
      enabled: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Flower className="h-6 w-6 text-white" />
              </div>
                <div>
                <h1 className="text-xl font-bold text-gray-900">87app</h1>
                <p className="text-sm text-gray-500">顧客向けアプリ</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.email || 'ユーザー'}
                </p>
                <p className="text-xs text-gray-500">顧客</p>
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
        {/* タイトル */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            87app 顧客メニュー
          </h2>
          <p className="mt-2 text-gray-600">
            花屋でのお買い物をより楽しく、便利に
          </p>
        </div>

        {/* メニューグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => item.enabled ? navigate(item.route) : null}
                disabled={!item.enabled}
                className={`group relative bg-white rounded-2xl shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden ${
                  item.enabled 
                    ? 'hover:shadow-xl transform hover:-translate-y-1 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
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
                  
                  {/* Coming Soon 表示 */}
                  {!item.enabled && (
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Coming Soon
                    </div>
                  )}
                  
                  {/* 矢印アイコン */}
                  <div className={`absolute top-6 right-6 transition-colors duration-200 ${
                    item.enabled 
                      ? 'text-gray-300 group-hover:text-gray-400' 
                      : 'text-gray-200'
                  }`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <p>© 2024 87app. 顧客向けアプリケーション</p>
        </div>
      </div>
    </div>
  );
};
