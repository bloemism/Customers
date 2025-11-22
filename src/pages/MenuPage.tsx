import React from 'react';
import { Link } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { 
  Map, 
  BookOpen, 
  Calendar, 
  User, 
  QrCode, 
  Gift, 
  TrendingUp, 
  CreditCard, 
  FileText,
  AlertCircle,
  Shield,
  Scan,
  Banknote
} from 'lucide-react';

const MenuPage: React.FC = () => {
  const { customer } = useCustomer();

  const menuItems = [
    {
      title: '全国フローリストマップ',
      description: '全国の花屋を地図で検索',
      icon: Map,
      path: '/florist-map',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'フラワーレッスンマップ',
      description: 'フラワースクールを地図で検索',
      icon: BookOpen,
      path: '/lesson-map',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'レッスンスケジュール',
      description: '予約したレッスンの管理',
      icon: Calendar,
      path: '/lesson-schedule',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'マイプロフィール',
      description: 'プロフィール情報の管理',
      icon: User,
      path: '/profile',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'マイQRコード',
      description: 'ポイント情報のQRコード表示',
      icon: QrCode,
      path: '/qr-code',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      title: 'ポイント履歴',
      description: 'ポイントの獲得・使用履歴',
      icon: Gift,
      path: '/point-history',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      title: '人気ランキング',
      description: '地域別花の人気ランキング',
      icon: TrendingUp,
      path: '/ranking',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: '店舗決済',
      description: '店舗の決済コードを読み取り決済（クレジット・現金）',
      icon: Scan,
      path: '/store-payment',
      color: 'bg-emerald-500 hover:bg-emerald-600'
    },
    {
      title: '現金決済',
      description: '現金決済専用ページ（店舗で直接お支払い）',
      icon: Banknote,
      path: '/cash-payment',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: '決済履歴',
      description: '決済履歴の確認',
      icon: FileText,
      path: '/payment-history',
      color: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      title: '使い方ガイド',
      description: 'アプリの使い方とルール',
      icon: FileText,
      path: '/readme',
      color: 'bg-teal-500 hover:bg-teal-600'
    },
    {
      title: '個人データ保護と決済',
      description: '個人情報保護とStripe決済について',
      icon: Shield,
      path: '/privacy-and-payment',
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">87app</h1>
          <p className="text-gray-600">花屋顧客向けアプリ</p>
          
          {customer && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">現在のポイント</p>
                  <p className="text-2xl font-bold text-green-600">{customer.points} pt</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">レベル</p>
                  <p className="text-xl font-bold text-blue-600">Lv.{customer.level}</p>
                </div>
              </div>
            </div>
          )}

          {/* プロフィール未完了の場合のバナー */}
          {customer && (!customer.name || !customer.phone || !customer.address) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    プロフィール情報が不完全です。ポイント獲得のため、詳細情報を登録してください。
                  </p>
                </div>
                <Link 
                  to="/profile" 
                  className="ml-4 px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                >
                  登録する
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* メニューグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${item.color} text-white mr-4`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {item.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* フッター */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2024 87app. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
