import React, { useEffect, useState } from 'react';
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
  const [touchedButton, setTouchedButton] = useState<string | null>(null);

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
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: 'url(/background.jpg)' }}
    >
      {/* ヘッダー */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-teal-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Flower className="h-8 w-8 text-teal-500" />
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-teal-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-8 w-8 text-teal-600" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => {
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className="group relative backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl active:shadow-2xl transition-all duration-300 overflow-hidden touch-manipulation transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
                style={{
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.4) 0%, rgba(13, 148, 136, 0.5) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget;
                  if (target) {
                    target.style.background = 'linear-gradient(135deg, rgba(251, 146, 60, 0.4) 0%, rgba(234, 88, 12, 0.5) 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget;
                  if (target) {
                    target.style.background = 'linear-gradient(135deg, rgba(20, 184, 166, 0.4) 0%, rgba(13, 148, 136, 0.5) 100%)';
                  }
                }}
                onTouchStart={(e) => {
                  setTouchedButton(item.id);
                  const target = e.currentTarget;
                  if (target) {
                    target.style.background = 'linear-gradient(135deg, rgba(251, 146, 60, 0.7) 0%, rgba(234, 88, 12, 0.8) 100%)';
                    target.style.transform = 'scale(0.95)';
                  }
                }}
                onTouchEnd={(e) => {
                  const target = e.currentTarget;
                  setTimeout(() => {
                    setTouchedButton(null);
                    if (target) {
                      target.style.background = 'linear-gradient(135deg, rgba(20, 184, 166, 0.4) 0%, rgba(13, 148, 136, 0.5) 100%)';
                      target.style.transform = 'scale(1)';
                    }
                  }, 150);
                }}
              >
                {/* グラデーションオーバーレイ */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 opacity-50" />
                
                {/* 光沢効果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* モバイル用の光沢効果 */}
                {touchedButton === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-100 transition-opacity duration-200" />
                )}
                
                {/* コンテンツ */}
                <div className="relative p-4 text-left">
                  {/* タイトル */}
                  <h3 className="text-sm font-bold text-white mb-2 group-hover:text-white group-active:text-white transition-colors duration-200 drop-shadow-lg shadow-black/50">
                    {item.title}
                  </h3>
                  
                  {/* 説明 */}
                  <p className="text-white text-xs leading-relaxed group-hover:text-white group-active:text-white transition-colors duration-200 drop-shadow-lg shadow-black/50">
                    {item.description}
                  </p>
                </div>
                
                {/* ボタン下部のアクセントライン */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/40 via-white/60 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* 上部のハイライト */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
