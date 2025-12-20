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
  UserCircle,
  Scan,
  Receipt,
  History,
  Shield,
  ChevronRight
} from 'lucide-react';

// 花屋の内観画像（ユーザー提供のイメージ）
const MENU_BG = '/menu-bg.png';

// メニュー項目の型定義
interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
  category: 'primary' | 'secondary' | 'utility';
  route: string;
}

const levelConfig = {
  BASIC: { 
    name: 'BASIC', 
    color: '#3D3A36',
    bgColor: '#F5F0E8',
    minPoints: 0,
    maxPoints: 99,
    nextLevel: 'REGULAR'
  },
  REGULAR: { 
    name: 'REGULAR', 
    color: '#5C6B4A',
    bgColor: '#E8EDE4',
    minPoints: 100,
    maxPoints: 499,
    nextLevel: 'PRO'
  },
  PRO: { 
    name: 'PRO', 
    color: '#C4856C',
    bgColor: '#F5EBE6',
    minPoints: 500,
    maxPoints: 999,
    nextLevel: 'EXPERT'
  },
  EXPERT: { 
    name: 'EXPERT', 
    color: '#3D4A35',
    bgColor: '#E0D6C8',
    minPoints: 1000,
    maxPoints: 9999,
    nextLevel: null
  }
};

export const CustomerMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const { customer, signOut, refreshCustomer } = useCustomerAuth();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !customer) {
        await refreshCustomer();
      }
    };
    fetchCustomerData();
  }, [customer, refreshCustomer]);

  // メニュー項目の定義
  const menuItems: MenuItem[] = [
    {
      id: 'customer-qr',
      title: 'マイ会員コード',
      description: '会員コードとポイント残高を表示',
      icon: QrCode,
      category: 'primary',
      route: '/customer-qr'
    },
    {
      id: 'store-payment',
      title: '店舗決済',
      description: '店舗の決済コードを読み取り決済',
      icon: Scan,
      category: 'primary',
      route: '/store-payment'
    },
    {
      id: 'florist-map',
      title: 'フローリストマップ',
      description: 'GPS位置情報で花屋を検索',
      icon: MapPin,
      category: 'primary',
      route: '/florist-map'
    },
    {
      id: 'flower-lesson-map',
      title: 'レッスンマップ',
      description: 'フラワースクールを地図で検索',
      icon: Map,
      category: 'primary',
      route: '/flower-lesson-map'
    },
    {
      id: 'customer-lesson-schedules',
      title: 'レッスンスケジュール',
      description: '登録スクールのレッスン予定',
      icon: Calendar,
      category: 'primary',
      route: '/customer-lesson-schedules'
    },
    {
      id: 'popularity-rankings',
      title: '人気ランキング',
      description: '全国の月次ランキング',
      icon: TrendingUp,
      category: 'primary',
      route: '/popularity-rankings'
    },
    {
      id: 'customer-profile',
      title: 'マイプロフィール',
      description: 'プロフィール情報の登録・更新',
      icon: UserCircle,
      category: 'secondary',
      route: '/customer-profile'
    },
    {
      id: 'customer-payments',
      title: '決済履歴',
      description: '過去の決済履歴と総決済金額',
      icon: Receipt,
      category: 'secondary',
      route: '/customer-payments'
    },
    {
      id: 'customer-points',
      title: 'ポイント履歴',
      description: 'ポイントの獲得・使用履歴',
      icon: History,
      category: 'secondary',
      route: '/customer-points'
    },
    {
      id: 'customer-readme',
      title: '使い方ガイド',
      description: 'アプリの使い方とルール',
      icon: BookOpen,
      category: 'utility',
      route: '/customer-readme'
    },
    {
      id: 'privacy-and-payment',
      title: 'プライバシーと決済',
      description: '個人情報保護とStripe決済について',
      icon: Shield,
      category: 'utility',
      route: '/privacy-and-payment'
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
      nextLevelPoints: currentLevel.nextLevel 
        ? levelConfig[currentLevel.nextLevel as keyof typeof levelConfig].minPoints - points 
        : 0
    };
  };

  const defaultCustomer = customer || {
    id: '',
    name: 'ゲストユーザー',
    email: 'guest@example.com',
    points: 0,
    level: 'BASIC' as const,
  };

  const levelInfo = getLevelInfo(defaultCustomer.level);
  const levelProgress = getLevelProgress(defaultCustomer.points, defaultCustomer.level);

  const primaryItems = menuItems.filter(item => item.category === 'primary');
  const secondaryItems = menuItems.filter(item => item.category === 'secondary');
  const utilityItems = menuItems.filter(item => item.category === 'utility');

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 背景画像 - 花屋店舗内 */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${MENU_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.85
        }}
      />
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(180deg, rgba(250,248,245,0.35) 0%, rgba(250,248,245,0.25) 50%, rgba(245,240,232,0.35) 100%)'
        }}
      />

      {/* ヘッダー */}
      <header 
        className="sticky top-0 z-50 border-b"
        style={{ 
          backgroundColor: 'rgba(250,248,245,0.95)',
          backdropFilter: 'blur(8px)',
          borderColor: '#E0D6C8'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl" style={{ color: '#5C6B4A' }}>✿</span>
              <div>
                <p 
                  className="text-xs tracking-[0.2em]"
                  style={{ color: '#2D2A26', fontWeight: 600 }}
                >
                  87app
                </p>
                <p 
                  className="text-sm"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2D2A26',
                    fontWeight: 600
                  }}
                >
                  Customer Lounge
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-xs tracking-wide transition-all duration-300 rounded-sm border"
              style={{ 
                borderColor: '#E0D6C8',
                color: '#3D3A36'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F5F0E8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* プロフィールカード */}
        <section 
          className="rounded-sm overflow-hidden shadow-lg"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.97)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* ユーザー情報 */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: '#F5F0E8' }}
                >
                  🌸
                </div>
                <div>
                  <p 
                    className="text-xs tracking-[0.2em] mb-1"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    MEMBER
                  </p>
                  <h2 
                    className="text-xl mb-1"
                    style={{ 
                      fontFamily: "'Noto Serif JP', serif",
                      color: '#2D2A26'
                    }}
                  >
                    {defaultCustomer.name}
                  </h2>
                  <p className="text-xs" style={{ color: '#3D3A36' }}>
                    {defaultCustomer.email}
                  </p>
                </div>
              </div>

              {/* ポイント・レベル */}
              <div className="flex gap-4">
                <div 
                  className="px-5 py-3 rounded-sm text-center"
                  style={{ backgroundColor: '#F5F0E8' }}
                >
                  <p 
                    className="text-xs tracking-[0.15em] mb-1"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    POINTS
                  </p>
                  <p 
                    className="text-2xl"
                    style={{ 
                      fontFamily: "'Cormorant Garamond', serif",
                      color: '#3D4A35',
                      fontWeight: 600
                    }}
                  >
                    {defaultCustomer.points}
                  </p>
                </div>
                <div 
                  className="px-5 py-3 rounded-sm text-center"
                  style={{ backgroundColor: levelInfo.bgColor }}
                >
                  <p 
                    className="text-xs tracking-[0.15em] mb-1"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    LEVEL
                  </p>
                  <p 
                    className="text-sm font-medium tracking-wider"
                    style={{ color: levelInfo.color }}
                  >
                    {levelInfo.name}
                  </p>
                </div>
              </div>
            </div>

            {/* プログレスバー */}
            {levelInfo.nextLevel && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E0D6C8' }}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs" style={{ color: '#3D3A36' }}>
                    次のレベルまで
                  </p>
                  <p className="text-xs" style={{ color: '#5C6B4A' }}>
                    あと {levelProgress.nextLevelPoints} pt
                  </p>
                </div>
                <div 
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: '#E0D6C8' }}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${levelProgress.progress}%`,
                      backgroundColor: '#5C6B4A'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* メインメニュー */}
        <section>
          <p 
            className="text-xs tracking-[0.3em] mb-4 px-1"
            style={{ color: '#3D3A36' }}
          >
            MAIN MENU
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {primaryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                onTouchStart={() => setActiveCard(item.id)}
                onTouchEnd={() => setTimeout(() => setActiveCard(null), 200)}
                className={`group p-3 sm:p-4 md:p-5 rounded-sm text-left transition-all duration-300 ${
                  activeCard === item.id ? 'shadow-lg -translate-y-1' : 'hover:shadow-lg hover:-translate-y-1'
                }`}
                style={{ 
                  backgroundColor: activeCard === item.id ? '#FFFFFF' : 'rgba(255,255,255,0.95)',
                  border: '1px solid #E0D6C8',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              >
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  {item.icon && (
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{ 
                        backgroundColor: activeCard === item.id ? '#5C6B4A' : '#F5F0E8'
                      }}
                    >
                      <item.icon 
                        className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300" 
                        style={{ 
                          color: activeCard === item.id ? '#FAF8F5' : '#5C6B4A'
                        }} 
                      />
                    </div>
                  )}
                  <ChevronRight 
                    className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  />
                </div>
                <h3 
                  className="text-xs sm:text-sm mb-1"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2D2A26',
                    fontWeight: 500
                  }}
                >
                  {item.title}
                </h3>
                <p 
                  className="text-xs leading-relaxed"
                  style={{ color: '#2D2A26', fontWeight: 600 }}
                >
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* サブメニュー */}
        <section>
          <p 
            className="text-xs tracking-[0.3em] mb-4 px-1"
            style={{ color: '#3D3A36' }}
          >
            MY DATA
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
            {secondaryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-sm text-left transition-all duration-300 hover:shadow-lg"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #E0D6C8',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              >
                {item.icon && (
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#F5F0E8' }}
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#5C6B4A' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-xs sm:text-sm"
                    style={{ color: '#1A1815', fontWeight: 600 }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="text-xs truncate"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight 
                  className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-all duration-300"
                  style={{ color: '#2D2A26', fontWeight: 600 }}
                />
              </button>
            ))}
          </div>
        </section>

        {/* ユーティリティメニュー */}
        <section className="pb-8">
          <p 
            className="text-xs tracking-[0.3em] mb-4 px-1"
            style={{ color: '#3D3A36' }}
          >
            INFORMATION
          </p>
          <div className="space-y-2">
            {utilityItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className="group w-full flex items-center justify-between p-3 sm:p-4 rounded-sm text-left transition-all duration-300 hover:bg-white"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: '1px solid #E0D6C8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {item.icon && (
                    <item.icon className="w-4 h-4" style={{ color: '#3D3A36' }} />
                  )}
                  <span 
                    className="text-xs sm:text-sm"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    {item.title}
                  </span>
                </div>
                <ChevronRight 
                  className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 group-hover:opacity-100 transition-all duration-300"
                  style={{ color: '#2D2A26', fontWeight: 600 }}
                />
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer 
        className="relative z-10 py-6 border-t"
        style={{ 
          backgroundColor: 'rgba(245,240,232,0.9)',
          borderColor: '#E0D6C8'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p 
            className="text-xs"
            style={{ color: '#3D3A36' }}
          >
            © 2024 87app. 花のある生活を、もっとスマートに。
          </p>
        </div>
      </footer>
    </div>
  );
};
