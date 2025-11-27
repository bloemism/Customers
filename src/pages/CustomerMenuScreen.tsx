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
  User,
  UserPlus,
  Scan,
  Receipt,
  History
} from 'lucide-react';

// メニュー項目の型定義
interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
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
  const [activeCard, setActiveCard] = useState<string | null>(null);

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
      id: 'customer-profile',
      title: 'マイプロフィール',
      description: 'プロフィール情報の登録・更新',
      icon: UserPlus,
      color: 'from-indigo-500 to-purple-600',
      route: '/customer-profile'
    },
    {
      id: 'customer-qr',
      title: 'マイ顧客コード',
      description: '顧客コードとポイント残高を表示',
      icon: QrCode,
      color: 'from-blue-500 to-cyan-600',
      route: '/customer-qr'
    },
    {
      id: 'store-payment',
      title: '店舗決済',
      description: '店舗の決済コードを読み取り決済（現金・クレジット）',
      icon: Scan,
      color: 'from-green-500 to-emerald-600',
      route: '/store-payment'
    },
    {
      id: 'customer-payments',
      title: '決済履歴',
      description: '過去の決済履歴と総決済金額を確認',
      icon: Receipt,
      color: 'from-violet-500 to-purple-600',
      route: '/customer-payments'
    },
    {
      id: 'customer-points',
      title: 'ポイント履歴',
      description: 'ポイントの獲得・使用履歴を確認',
      icon: History,
      color: 'from-amber-500 to-orange-600',
      route: '/customer-points'
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
    },
    {
      id: 'privacy-and-payment',
      title: '個人データ保護と決済',
      description: '個人情報保護とStripe決済について',
      color: 'from-blue-500 to-indigo-600',
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
    <div className="relative min-h-screen bg-[#f1ede7] overflow-hidden">
      {/* Wood + Brick inspired background */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(255,255,255,0.2) 0%, rgba(241,237,231,0.9) 100%), url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div
        className="absolute inset-0 opacity-35 mix-blend-multiply"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80'), url('https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=80')",
          backgroundSize: 'cover, 800px',
          backgroundRepeat: 'no-repeat, repeat',
          backgroundPosition: 'center, top left'
        }}
      />

      {/* Accent lines */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center gap-6 px-4 pt-6">
        <span className="h-1 w-32 rounded-full bg-gradient-to-r from-[#0fbab9] to-[#01a7a5]" />
        <span className="h-1 w-32 rounded-full bg-gradient-to-r from-[#ff9f66] to-[#f77f3f]" />
      </div>

      <header className="relative z-10 border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400">87app</p>
            <h1 className="text-2xl font-semibold text-gray-900">Customer Lounge</h1>
            <p className="text-sm text-gray-500">日々の花時間をアップデートするメニュー</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelInfo.bgColor} ${levelInfo.textColor}`}>
              {levelInfo.name}
            </span>
            <span>{defaultCustomer.points} pt</span>
            <span>{defaultCustomer.email}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 transition hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-4 py-10">
        <section className="grid gap-3 rounded-3xl bg-white/85 p-6 shadow-xl backdrop-blur-sm md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Profile</p>
            <h2 className="text-3xl font-semibold text-gray-900">{defaultCustomer.name}</h2>
            <p className="text-sm text-gray-500">{defaultCustomer.address || '居住地未登録'}</p>
            <p className="text-sm text-gray-500">
              {defaultCustomer.birth_date ? convertISODateToJapanese(defaultCustomer.birth_date) : '生年月日未登録'}
            </p>
            {!customer && <p className="text-sm text-teal-600">プロフィールを仕上げると、より豊かな体験になります。</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.4em] text-gray-350">Points</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{defaultCustomer.points}</p>
              <p className="text-[11px] text-gray-400">累積ポイント</p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.4em] text-gray-350">Progress</p>
              <p className="mt-1 text-xs text-gray-500">
                {levelInfo.nextLevel ? `次のレベルまで ${levelProgress.nextLevelPoints} pt` : '最高レベルです'}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                <div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${levelInfo.color}`}
                  style={{ width: `${levelProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                onTouchStart={() => setActiveCard(item.id)}
                onTouchEnd={() => setTimeout(() => setActiveCard(null), 200)}
                className={`group rounded-2xl border border-gray-200/80 bg-white px-4 py-3 text-left shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-transparent hover:bg-[#ffe8d9] hover:shadow-2xl ${
                  activeCard === item.id ? 'border-transparent bg-[#ffe8d9] -translate-y-1.5 shadow-2xl' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.4em] text-gray-350 block">
                      {item.id}
                    </span>
                    <h3 className="mt-2 text-base font-semibold text-gray-900">{item.title}</h3>
                  </div>
                  {item.icon ? (
                    <span
                      className={`h-8 w-8 rounded-full border border-gray-200 text-gray-400 flex items-center justify-center transition duration-300 group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-[#0fbab9]/40 group-hover:to-[#ff9f66]/55 group-hover:text-white group-hover:translate-x-1.5 group-hover:-translate-y-1.5 ${
                        activeCard === item.id
                          ? 'border-transparent bg-gradient-to-br from-[#0fbab9]/40 to-[#ff9f66]/55 text-white translate-x-1.5 -translate-y-1.5'
                          : ''
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                  ) : (
                    <span
                      className={`text-gray-300 text-sm transition group-hover:text-gray-600 group-hover:translate-x-1 group-hover:-translate-y-1 ${
                        activeCard === item.id ? 'text-gray-600 translate-x-1 -translate-y-1' : ''
                      }`}
                    >
                      →
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{item.description}</p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
