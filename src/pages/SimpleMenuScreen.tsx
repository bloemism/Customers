import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { PageLayout, Card } from '../components/common';
import { theme } from '../styles/theme';
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
  TrendingUp,
  CreditCard
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
      color: 'from-green-500 to-emerald-600',
      route: '/checkout',
      requiredFeature: 'CUSTOMER_CHECKOUT'
    },
    {
      id: 'product-management',
      title: '商品管理',
      description: '品目・色・価格の管理',
      icon: Flower,
      color: 'from-pink-500 to-rose-600',
      route: '/product-management',
      requiredFeature: 'PRODUCT_MANAGEMENT'
    },
    {
      id: 'florist-map',
      title: '全国フローリストマップ',
      description: 'GPS位置情報で花屋を検索',
      icon: MapPin,
      color: 'from-blue-500 to-cyan-600',
      route: '/florist-map',
      requiredFeature: 'FLORIST_MAP'
    },
    {
      id: 'customer-management',
      title: '顧客管理',
      description: 'お客様データ・ポイント・販売履歴',
      icon: Users,
      color: 'from-purple-500 to-indigo-600',
      route: '/customer-management',
      requiredFeature: 'CUSTOMER_MANAGEMENT'
    },
    {
      id: 'store-management',
      title: '店舗データ管理',
      description: 'GPS位置・店舗情報のカスタマイズ',
      icon: Store,
      color: 'from-orange-500 to-red-600',
      route: '/store-registration',
      requiredFeature: 'STORE_DATA_MANAGEMENT'
    },
    {
      id: 'flower-lesson-map',
      title: 'フラワーレッスンマップ',
      description: 'レッスンスクールの位置情報検索',
      icon: Map,
      color: 'from-teal-500 to-green-600',
      route: '/flower-lesson-map',
      requiredFeature: 'FLOWER_LESSON_MAP'
    },
    {
      id: 'lesson-school-management',
      title: 'レッスンスクール管理',
      description: 'スクール情報・講師・レッスン内容',
      icon: GraduationCap,
      color: 'from-violet-500 to-purple-600',
      route: '/lesson-school-management',
      requiredFeature: 'LESSON_SCHOOL_MANAGEMENT'
    },
    {
      id: 'lesson-schedule-management',
      title: 'レッスンスケジュール管理',
      description: 'レッスン日程・予約・参加者管理',
      icon: Calendar,
      color: 'from-amber-500 to-yellow-600',
      route: '/lesson-schedule-management',
      requiredFeature: 'LESSON_SCHEDULE_MANAGEMENT'
    },
    {
      id: 'popularity-rankings',
      title: '人気ランキング',
      description: '全国の購入データを元にした月次ランキング',
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-600',
      route: '/popularity-rankings',
      requiredFeature: 'POPULARITY_RANKINGS'
    },
    {
      id: 'subscription-management',
      title: 'サブスクリプション管理',
      description: '月額プランの管理と支払い方法の設定',
      icon: CreditCard,
      color: 'from-indigo-500 to-purple-600',
      route: '/subscription-management',
      requiredFeature: 'FLORIST_MAP' // 常に表示
    }
  ];

  useEffect(() => {
    // ユーザーのプランを判定（実際のデータベース構造に合わせて修正）
    const determineUserPlan = async () => {
      if (!user?.email) return;

      try {
        console.log('プラン判定開始:', user.email);
        console.log('ユーザー情報詳細:', {
          id: user.id,
          email: user.email,
          name: user.name
        });
        
        // データベース接続テスト開始...
        console.log('=== データベース接続テスト ===');
        
        // storesテーブルの存在確認
        console.log('storesテーブルクエリ開始...');
        const { data: storesTest, error: storesTestError } = await supabase
          .from('stores')
          .select('*')
          .limit(1);
        console.log('storesテーブルテスト完了:', storesTest, 'エラー:', storesTestError);
        
        // lesson_schoolsテーブルの存在確認
        console.log('lesson_schoolsテーブルクエリ開始...');
        const { data: schoolsTest, error: schoolsTestError } = await supabase
          .from('lesson_schools')
          .select('*')
          .limit(1);
        console.log('lesson_schoolsテーブルテスト完了:', schoolsTest, 'エラー:', schoolsTestError);
        
        // storesテーブルから店舗情報を取得（実際にデータが入っているテーブル）
        console.log('ユーザー固有のstoresテーブルクエリ開始...');
        let storeData = null;
        let storeError = null;
        
        try {
          const storeQueryPromise = supabase
            .from('stores')
            .select('id, name, email, address, phone')
            .eq('email', user.email)
            .single();
          
          const storeQueryTimeout = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('ユーザー固有storesテーブルクエリタイムアウト')), 5000)
          );
          
          const storeQueryResult = await Promise.race([
            storeQueryPromise,
            storeQueryTimeout
          ]);
          storeData = storeQueryResult.data;
          storeError = storeQueryResult.error;
        } catch (storeQueryError) {
          console.error('ユーザー固有storesテーブルクエリエラー:', storeQueryError);
          storeError = storeQueryError;
        }
        
        console.log('storesテーブル情報取得完了:', storeData, 'エラー:', storeError);

        // スクール情報をチェック
        console.log('ユーザー固有のlesson_schoolsテーブルクエリ開始...');
        let schoolData = null;
        let schoolError = null;
        
        try {
          const schoolQueryPromise = supabase
            .from('lesson_schools')
            .select('id, name, store_email')
            .eq('store_email', user.email)
            .single();
          
          const schoolQueryTimeout = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('ユーザー固有lesson_schoolsテーブルクエリタイムアウト')), 5000)
          );
          
          const schoolQueryResult = await Promise.race([
            schoolQueryPromise,
            schoolQueryTimeout
          ]);
          schoolData = schoolQueryResult.data;
          schoolError = schoolQueryResult.error;
        } catch (schoolQueryError) {
          console.error('ユーザー固有lesson_schoolsテーブルクエリエラー:', schoolQueryError);
          schoolError = schoolQueryError;
        }
        
        console.log('lesson_schoolsテーブル情報取得完了:', schoolData, 'エラー:', schoolError);

        // プラン判定ロジック（実際のデータに基づく）
        console.log('プラン判定ロジック開始...');
        if (storeData && storeData.id) {
          // storesテーブルにデータがある場合はフローリストプラン
          console.log('フローリストプランに設定（storesテーブルにデータあり）');
          setUserPlan('FLORIST');
          console.log('setUserPlan("FLORIST")実行完了');
        } else if (schoolData && schoolData.id) {
          // lesson_schoolsテーブルにデータがある場合はフラワースクールプラン
          console.log('フラワースクールプランに設定（lesson_schoolsテーブルにデータあり）');
          setUserPlan('FLOWER_SCHOOL');
          console.log('setUserPlan("FLOWER_SCHOOL")実行完了');
        } else {
          // どちらにもデータがない場合はデフォルトでフラワースクールプラン
          console.log('デフォルトでフラワースクールプランに設定（データなし）');
          setUserPlan('FLOWER_SCHOOL');
          console.log('setUserPlan("FLOWER_SCHOOL")実行完了');
        }
        
        console.log('プラン判定ロジック完了');
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
    if (item.id === 'subscription-management') return true; // 常に表示
    const hasAccess = checkFeatureAccess(userPlan, item.requiredFeature);
    console.log(`メニュー項目 "${item.title}": プラン=${userPlan}, 機能=${item.requiredFeature}, アクセス=${hasAccess}`);
    return hasAccess;
  });

  console.log('利用可能なメニュー項目数:', availableMenuItems.length);
  console.log('ユーザープラン:', userPlan);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Flower className="h-8 w-8 text-pink-500" />
              <h1 className="text-xl font-bold text-gray-900">87app</h1>
              {userPlan && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  userPlan === 'FLORIST' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {userPlan === 'FLORIST' ? 'フローリスト' : 'フラワースクール'}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* プラン情報 */}
        {userPlan && (
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {userPlan === 'FLORIST' ? 'フローリストプラン' : 'フラワースクールプラン'}
            </h2>
            <p className="text-gray-600 mb-4">
              {userPlan === 'FLORIST' 
                ? '全機能が利用可能です（¥5,500/月）'
                : '一部機能が利用可能です（¥3,300/月）'
              }
            </p>
            
            {/* デバッグ用プラン切り替え */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setUserPlan('FLORIST')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  userPlan === 'FLORIST'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                フローリストプラン
              </button>
              <button
                onClick={() => setUserPlan('FLOWER_SCHOOL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  userPlan === 'FLOWER_SCHOOL'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                フラワースクールプラン
              </button>
            </div>
          </div>
        )}

        {/* メニューグリッド */}
        {availableMenuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableMenuItems.map((item) => {
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
        ) : (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-8 border border-gray-200">
              <Flower className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">メニュー項目が見つかりません</h3>
              <p className="text-gray-600 mb-4">
                現在のプランでは利用可能な機能がありません。
              </p>
              <div className="text-sm text-gray-500">
                <p>ユーザープラン: {userPlan || '未設定'}</p>
                <p>利用可能なメニュー項目数: {availableMenuItems.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* プランアップグレード案内 */}
        {userPlan === 'FLOWER_SCHOOL' && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4">
                フローリストプランにアップグレード
              </h3>
              <p className="text-blue-700 mb-6">
                商品管理やお客様会計など、追加機能を利用できます
              </p>
              <button
                onClick={() => navigate('/subscription-management')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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