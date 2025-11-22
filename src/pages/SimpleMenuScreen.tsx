import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { 
  ShoppingCart, 
  MapPin, 
  Users, 
  Store, 
  LogOut, 
  Flower,
  Map,
  BookOpen,
  Calendar,
  GraduationCap,
  TrendingUp,
  CreditCard,
  Shield
} from 'lucide-react';
import { checkFeatureAccess, AVAILABLE_FEATURES } from '../lib/stripe';
import { supabase } from '../lib/supabase';

// メニュー項目の型定義
interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  route: string;
  requiredFeature: keyof typeof AVAILABLE_FEATURES;
}

export const SimpleMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useSimpleAuth();
  const [userPlan, setUserPlan] = useState<'FLORIST' | 'FLOWER_SCHOOL' | null>(null);
  const [loading, setLoading] = useState(true);

  // メニュー項目の定義（機能制限付き）
  const menuItems: MenuItem[] = [
    {
      id: 'checkout',
      title: 'お客様会計',
      description: '品目自動変換・ポイント管理・QR決済',
      icon: ShoppingCart,
      color: 'from-emerald-400 to-green-500',
      route: '/checkout',
      requiredFeature: 'CUSTOMER_CHECKOUT'
    },
    {
      id: 'product-management',
      title: '商品管理',
      description: '品目・色・価格の管理',
      icon: Flower,
      color: 'from-pink-400 to-rose-500',
      route: '/product-management',
      requiredFeature: 'PRODUCT_MANAGEMENT'
    },
    {
      id: 'florist-map',
      title: '全国フローリストマップ',
      description: 'GPS位置情報で花屋を検索',
      icon: MapPin,
      color: 'from-sky-400 to-blue-500',
      route: '/florist-map',
      requiredFeature: 'FLORIST_MAP'
    },
    {
      id: 'customer-management',
      title: '顧客管理',
      description: 'お客様データ・ポイント・販売履歴',
      icon: Users,
      color: 'from-violet-400 to-purple-500',
      route: '/customer-management',
      requiredFeature: 'CUSTOMER_MANAGEMENT'
    },
    {
      id: 'store-management',
      title: '店舗データ管理',
      description: 'GPS位置・店舗情報のカスタマイズ',
      icon: Store,
      color: 'from-amber-400 to-orange-500',
      route: '/store-registration',
      requiredFeature: 'STORE_DATA_MANAGEMENT'
    },
    {
      id: 'flower-lesson-map',
      title: 'フラワーレッスンマップ',
      description: 'レッスンスクールの位置情報検索',
      icon: Map,
      color: 'from-teal-400 to-green-500',
      route: '/flower-lesson-map',
      requiredFeature: 'FLOWER_LESSON_MAP'
    },
    {
      id: 'lesson-school-management',
      title: 'レッスンスクール管理',
      description: 'スクール情報・講師・レッスン内容',
      icon: GraduationCap,
      color: 'from-violet-400 to-purple-500',
      route: '/lesson-school-management',
      requiredFeature: 'LESSON_SCHOOL_MANAGEMENT'
    },
    {
      id: 'lesson-schedule-management',
      title: 'レッスンスケジュール管理',
      description: 'レッスン日程・予約・参加者管理',
      icon: Calendar,
      color: 'from-amber-400 to-yellow-500',
      route: '/lesson-schedule-management',
      requiredFeature: 'LESSON_SCHEDULE_MANAGEMENT'
    },
    {
      id: 'popularity-rankings',
      title: '人気ランキング',
      description: '全国の購入データを元にした月次ランキング',
      icon: TrendingUp,
      color: 'from-yellow-400 to-orange-500',
      route: '/popularity-rankings',
      requiredFeature: 'POPULARITY_RANKINGS'
    },
    {
      id: 'subscription-management',
      title: 'サブスクリプション管理',
      description: '月額プランの管理と支払い方法の設定',
      icon: CreditCard,
      color: 'from-indigo-400 to-purple-500',
      route: '/subscription-management',
      requiredFeature: 'FLORIST_MAP' // 常に表示
    },
    {
      id: 'readme',
      title: 'Read me',
      description: '使い方・システム詳細・利用規約',
      icon: BookOpen,
      color: 'from-gray-400 to-slate-500',
      route: '/readme',
      requiredFeature: 'FLORIST_MAP' // 常に表示
    },
    {
      id: 'policy',
      title: '個人データ保護と決済',
      description: '個人情報保護とStripe決済について',
      icon: Shield,
      color: 'from-blue-400 to-indigo-500',
      route: '/privacy-and-payment',
      requiredFeature: 'FLORIST_MAP' // 常に表示
    }
  ];

  useEffect(() => {
    // ユーザーのプランを判定（実際のデータベース構造に合わせて修正）
    const determineUserPlan = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        console.log('プラン判定開始:', user.email);
        
        // Supabaseが利用可能かチェック
        if (!supabase) {
          console.error('Supabaseが利用できません');
          setUserPlan('FLOWER_SCHOOL');
          setLoading(false);
          return;
        }
        
        // storesテーブルから店舗情報を取得（実際にデータが入っているテーブル）
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, email, address, phone')
          .eq('email', user.email)
          .single();

        console.log('storesテーブル情報:', storeData, 'エラー:', storeError);

        // スクール情報をチェック
        const { data: schoolData, error: schoolError } = await supabase
          .from('lesson_schools')
          .select('id, name, store_email')
          .eq('store_email', user.email)
          .single();

        console.log('lesson_schoolsテーブル情報:', schoolData, 'エラー:', schoolError);

        // プラン判定ロジック（実際のデータに基づく）
        if (storeData && storeData.id) {
          // storesテーブルにデータがある場合はフローリストプラン
          console.log('フローリストプランに設定（storesテーブルにデータあり）');
          setUserPlan('FLORIST');
        } else if (schoolData && schoolData.id) {
          // lesson_schoolsテーブルにデータがある場合はフラワースクールプラン
          console.log('フラワースクールプランに設定（lesson_schoolsテーブルにデータあり）');
          setUserPlan('FLOWER_SCHOOL');
        } else {
          // どちらにもデータがない場合はデフォルトでフラワースクールプラン
          console.log('デフォルトでフラワースクールプランに設定（データなし）');
          setUserPlan('FLOWER_SCHOOL');
        }
      } catch (error) {
        console.error('プラン判定エラー:', error);
        // エラーの場合はデフォルトでフラワースクールプラン
        setUserPlan('FLOWER_SCHOOL');
      } finally {
        setLoading(false);
      }
    };

    determineUserPlan();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/simple-login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // ユーザーのプランで利用可能なメニュー項目をフィルタリング
  const availableMenuItems = menuItems.filter(item => {
    if (item.id === 'subscription-management' || item.id === 'readme' || item.id === 'policy') return true; // 常に表示
    return checkFeatureAccess(userPlan, item.requiredFeature);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ヘッダー */}
      <div className="bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-200/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <Flower className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">87app</h1>
                {userPlan && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    userPlan === 'FLORIST' 
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' 
                      : 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border border-purple-200'
                  }`}>
                    {userPlan === 'FLORIST' ? 'フローリスト' : 'フラワースクール'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                <p className="text-xs text-gray-500">{userPlan || 'プラン確認中...'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/60 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* プラン情報 */}
        {userPlan && (
          <div className="mb-6 text-center">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                {userPlan === 'FLORIST' ? 'フローリストプラン' : 'フラワースクールプラン'}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                {userPlan === 'FLORIST' 
                  ? '全機能が利用可能です（¥5,500/月）'
                  : '一部機能が利用可能です（¥3,300/月）'
                }
              </p>
              
              {/* デバッグ用プラン切り替え */}
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                <button
                  onClick={() => setUserPlan('FLORIST')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                    userPlan === 'FLORIST'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  フローリストプラン
                </button>
                <button
                  onClick={() => setUserPlan('FLOWER_SCHOOL')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                    userPlan === 'FLOWER_SCHOOL'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  フラワースクールプラン
                </button>
              </div>
            </div>
          </div>
        )}

        {/* メニューグリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {availableMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/50 overflow-hidden"
              >
                {/* グラデーション背景 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative p-4 sm:p-5 text-center">
                  {/* アイコン */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} text-white mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  
                  {/* タイトル */}
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors duration-200 leading-tight">
                    {item.title}
                  </h3>
                  
                  {/* 説明 */}
                  <p className="text-gray-500 text-xs sm:text-sm leading-tight group-hover:text-gray-600 transition-colors duration-200 hidden sm:block">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* プランアップグレード案内 */}
        {userPlan === 'FLOWER_SCHOOL' && (
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-blue-200/50 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3 sm:mb-4">
                フローリストプランにアップグレード
              </h3>
              <p className="text-blue-700 text-sm sm:text-base mb-4 sm:mb-6">
                商品管理やお客様会計など、追加機能を利用できます
              </p>
              <button
                onClick={() => navigate('/subscription-management')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md"
              >
                プラン変更
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};