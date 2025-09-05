import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { supabase } from '../lib/supabase';
import { 
  QrCode, 
  MapPin, 
  Map, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  LogOut, 
  Flower,
  User,
  UserPlus,
  CreditCard,
  Scan
} from 'lucide-react';
import TechnicalPointsDisplay from '../components/TechnicalPointsDisplay';

// メニュー項目の型定義
interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  route: string;
}


const levelConfig = {
  BASIC: { 
    name: 'BASIC', 
    color: 'from-gray-400 to-gray-600', 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800',
    minPoints: 0,
    maxPoints: 99,
    nextLevel: 'REGULAR'
  },
  REGULAR: { 
    name: 'REGULAR', 
    color: 'from-blue-400 to-blue-600', 
    bgColor: 'bg-blue-100', 
    textColor: 'text-blue-800',
    minPoints: 100,
    maxPoints: 499,
    nextLevel: 'PRO'
  },
  PRO: { 
    name: 'PRO', 
    color: 'from-purple-400 to-purple-600', 
    bgColor: 'bg-purple-100', 
    textColor: 'text-purple-800',
    minPoints: 500,
    maxPoints: 999,
    nextLevel: 'EXPERT'
  },
  EXPERT: { 
    name: 'EXPERT', 
    color: 'from-yellow-400 to-yellow-600', 
    bgColor: 'bg-yellow-100', 
    textColor: 'text-yellow-800',
    minPoints: 1000,
    maxPoints: 9999,
    nextLevel: null
  }
};

export const CustomerMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const { customer, signOut, refreshCustomer } = useCustomerAuth();

  useEffect(() => {
    // 顧客データを取得
    const fetchCustomerData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !customer) {
        console.log('顧客データを取得中:', user.id);
        await refreshCustomer();
      }
    };
    
    fetchCustomerData();
  }, [customer, refreshCustomer]);

  // 顧客向けメニュー項目の定義
  const menuItems: MenuItem[] = [
    {
      id: 'customer-data-registration',
      title: 'マイプロフィール',
      description: 'プロフィール情報の登録・更新',
      icon: UserPlus,
      color: 'from-indigo-500 to-purple-600',
      route: '/customer-data-registration'
    },
    {
      id: 'customer-qr',
      title: 'マイQRコード',
      description: '決済用QRコードとポイント残高を表示',
      icon: QrCode,
      color: 'from-blue-500 to-cyan-600',
      route: '/customer-qr'
    },
    {
      id: 'store-payment',
      title: '店舗決済',
      description: '店舗のQRコードを読み取り決済（現金・クレジット）',
      icon: Scan,
      color: 'from-green-500 to-emerald-600',
      route: '/store-payment'
    },
    {
      id: 'florist-map',
      title: '全国フローリストマップ',
      description: 'GPS位置情報で花屋を検索',
      icon: MapPin,
      color: 'from-teal-500 to-cyan-600',
      route: '/florist-map'
    },
    {
      id: 'flower-lesson-map',
      title: 'フラワーレッスンマップ',
      description: 'レッスンスクールの位置情報検索',
      icon: Map,
      color: 'from-pink-500 to-rose-600',
      route: '/flower-lesson-map'
    },
    {
      id: 'lesson-schedule-management',
      title: 'レッスンスケジュール',
      description: 'レッスン日程・予約・参加者管理',
      icon: Calendar,
      color: 'from-pink-500 to-rose-600',
      route: '/lesson-schedule-management'
    },
    {
      id: 'popularity-rankings',
      title: '人気ランキング',
      description: '全国の購入データを元にした月次ランキング',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-600',
      route: '/popularity-rankings'
    },
    {
      id: 'customer-readme',
      title: 'Read me',
      description: '使い方・システム詳細・利用規約',
      icon: BookOpen,
      color: 'from-gray-500 to-slate-600',
      route: '/customer-readme'
    }
  ];


  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/customer-login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const getLevelInfo = (level: string) => {
    return levelConfig[level as keyof typeof levelConfig] || levelConfig.BASIC;
  };

  const getLevelProgress = (points: number, level: string) => {
    const currentLevel = getLevelInfo(level);
    const currentPoints = Math.max(0, points - currentLevel.minPoints);
    const levelRange = currentLevel.maxPoints - currentLevel.minPoints + 1;
    const progress = Math.min(100, (currentPoints / levelRange) * 100);
    
    return {
      progress,
      currentPoints,
      levelRange,
      nextLevelPoints: currentLevel.nextLevel ? levelConfig[currentLevel.nextLevel as keyof typeof levelConfig].minPoints - points : 0
    };
  };

  // ISO形式の日付を日本語形式に変換する関数
  const convertISODateToJapanese = (isoDate: string): string | null => {
    if (!isoDate) return null;
    
    // 「1972-12-15」形式を「1972年12月15日」形式に変換
    const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = match[1];
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      return `${year}年${month}月${day}日`;
    }
    
    return null;
  };

  // 顧客データが存在しない場合は、デフォルト値を設定
  const defaultCustomer = customer || {
    id: '',
    name: 'ゲストユーザー',
    alphabet: '',
    email: 'guest@example.com',
    phone: '',
    address: '',
    birth_date: '',
    points: 0,
    level: 'BASIC' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const levelInfo = getLevelInfo(defaultCustomer.level);
  const levelProgress = getLevelProgress(defaultCustomer.points, defaultCustomer.level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Flower className="h-8 w-8 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-900">87app</h1>
            </div>
            
            {/* デスクトップ表示 */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${levelInfo.bgColor} ${levelInfo.textColor}`}>
                  {levelInfo.name}
                </div>
                <div className="text-sm text-gray-600">
                  {defaultCustomer.points}pt
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {defaultCustomer.email}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>ログアウト</span>
              </button>
            </div>

            {/* モバイル表示 */}
            <div className="md:hidden flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${levelInfo.bgColor} ${levelInfo.textColor}`}>
                  {levelInfo.name}
                </div>
                <div className="text-sm text-gray-600">
                  {defaultCustomer.points}pt
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顧客情報カード */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{defaultCustomer.name}</h2>
                  {defaultCustomer.alphabet && (
                    <p className="text-lg text-gray-500 font-medium">{defaultCustomer.alphabet}</p>
                  )}
                  <p className="text-gray-600">{defaultCustomer.email}</p>
                  {defaultCustomer.address && (
                    <p className="text-sm text-gray-500 mt-1">📍 {defaultCustomer.address}</p>
                  )}
                  {defaultCustomer.birth_date && (
                    <p className="text-sm text-gray-500">🎂 {convertISODateToJapanese(defaultCustomer.birth_date) || defaultCustomer.birth_date}</p>
                  )}
                  {!customer && (
                    <p className="text-sm text-orange-600 mt-1">
                      ※ マイプロフィールを登録してください
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${levelInfo.bgColor} ${levelInfo.textColor}`}>
                  <span className="font-medium">{levelInfo.name}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {defaultCustomer.points}pt
                </div>
              </div>
            </div>
            
            {/* レベル進捗バー */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">レベル進捗</span>
                <span className="text-sm text-gray-500">
                  {levelProgress.currentPoints}/{levelProgress.levelRange}pt
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${levelInfo.color} transition-all duration-500`}
                  style={{ width: `${levelProgress.progress}%` }}
                ></div>
              </div>
              {levelInfo.nextLevel && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                  次のレベルまで {levelProgress.nextLevelPoints}pt
                </div>
              )}
            </div>
          </div>
        </div>

        {/* メニューグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                </div>
              </button>
            );
          })}
        </div>

        {/* 技術ポイント表示 */}
        <div className="mt-8">
          <TechnicalPointsDisplay />
        </div>

      </div>
    </div>
  );
};
