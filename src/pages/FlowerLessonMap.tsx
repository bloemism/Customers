import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Star,
  Search,
  X,
  Globe
} from 'lucide-react';
import { useScrollToTopOnMount } from '../hooks/useScrollToTop';

// レッスンスクールの型定義
interface LessonSchool {
  id: string;
  name: string;
  prefecture: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  instructor_name: string;
  instructor_bio: string;
  lesson_content: string;
  main_days: string[];
  main_time: string;
  trial_price: number;
  regular_price: number;
  latitude: number;
  longitude: number;
  website_url?: string;
  instagram_url?: string;
  is_active: boolean;
  created_at: string;
}

// 地域分類の型定義
interface RegionCategory {
  id: string;
  name: string;
  prefectures: string[];
  display_order: number;
}

const FlowerLessonMap: React.FC = () => {
  // const { user } = useSimpleAuth();
  
  // ページマウント時にスクロール位置をトップにリセット
  useScrollToTopOnMount();
  
  // レッスンスクール一覧
  const [lessonSchools, setLessonSchools] = useState<LessonSchool[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<LessonSchool[]>([]);
  
  // 地域分類
  const [regionCategories, setRegionCategories] = useState<RegionCategory[]>([]);
  
  // フィルター
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 選択されたスクール
  const [selectedSchool, setSelectedSchool] = useState<LessonSchool | null>(null);
  
  // 体験予約フォーム
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    message: ''
  });
  
  // ローディング状態
  const [loading, setLoading] = useState(true);

  // ランダムな色を生成する関数
  const getRandomColor = (id: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
      'bg-gradient-to-br from-orange-400 to-orange-600',
      'bg-gradient-to-br from-red-400 to-red-600'
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // レッスンスクールを読み込み
  useEffect(() => {
    const loadLessonSchools = async () => {
      try {
        setLoading(true);
        // 顧客向け：全スクール情報を表示（マップ検索用）
        const { data, error } = await supabase
          .from('lesson_schools')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('レッスンスクール読み込みエラー:', error);
        } else if (data) {
          console.log('読み込まれたスクールデータ:', data);
          console.log('スクール数:', data.length);
          console.log('スクール名一覧:', data.map(s => s.name));
          setLessonSchools(data);
          setFilteredSchools(data);
        }
      } catch (error) {
        console.error('レッスンスクール読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLessonSchools();
  }, []);



  // 地域分類を読み込み
  useEffect(() => {
    const loadRegionCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('region_categories')
          .select('*')
          .order('display_order');

        if (error) {
          console.error('地域分類読み込みエラー:', error);
        } else if (data) {
          setRegionCategories(data);
        }
      } catch (error) {
        console.error('地域分類読み込みエラー:', error);
      }
    };

    loadRegionCategories();
  }, []);

  // フィルタリング処理
  useEffect(() => {
    let filtered = lessonSchools;

    console.log('フィルタリング開始:', { lessonSchools: lessonSchools.length, selectedRegion, searchQuery });

    // 地域フィルター
    if (selectedRegion) {
      const region = regionCategories.find(r => r.id === selectedRegion);
      if (region) {
        filtered = filtered.filter(school => 
          region.prefectures.includes(school.prefecture)
        );
        console.log('地域フィルター適用後:', filtered.length);
      }
    }

    // 検索フィルター
    if (searchQuery) {
      filtered = filtered.filter(school =>
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.prefecture.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('検索フィルター適用後:', filtered.length);
    }

    console.log('最終フィルタリング結果:', filtered.length);
    setFilteredSchools(filtered);
  }, [lessonSchools, selectedRegion, searchQuery, regionCategories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">レッスンスクール情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-white hover:text-pink-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">フラワーレッスンマップ</h1>
                <p className="text-pink-100">全国のフラワーレッスンスクールを探す</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：フィルター・検索 */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">検索・フィルター</h2>
              
              {/* 検索バー */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  スクール名・地域で検索
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="スクール名、県、市を入力..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 地域フィルター */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地域で絞り込み
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべての地域</option>
                  {regionCategories.map(region => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 結果件数 */}
              <div className="text-sm text-gray-600">
                表示件数: {filteredSchools.length}件
              </div>
            </div>
          </div>

          {/* 右側：スクール一覧 */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">レッスンスクール一覧</h2>
              
                            {filteredSchools.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>条件に合うレッスンスクールが見つかりません</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 地域別にグループ化 */}
                  {regionCategories
                    .filter(region => {
                      // 選択された地域がある場合はその地域のみ表示
                      if (selectedRegion) {
                        return region.id === selectedRegion;
                      }
                      // 地域が選択されていない場合は、スクールがある地域のみ表示
                      return filteredSchools.some(school => 
                        region.prefectures.includes(school.prefecture)
                      );
                    })
                    .map(region => {
                      const schoolsInRegion = filteredSchools.filter(school => 
                        region.prefectures.includes(school.prefecture)
                      );
                      
                      if (schoolsInRegion.length === 0) return null;
                      
                      return (
                        <div key={region.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                            {region.name} ({schoolsInRegion.length}校)
                          </h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-1">
                {schoolsInRegion.map(school => (
                  <div
                    key={school.id}
                    className={`p-0.5 rounded-sm transition-all cursor-pointer text-center shadow-sm hover:shadow-lg transform hover:scale-105 ${getRandomColor(school.id)}`}
                    onClick={() => setSelectedSchool(school)}
                    title={`${school.name} (${school.prefecture} ${school.city})`}
                  >
                    <div className="text-[10px] font-medium text-white drop-shadow-sm leading-tight min-h-[2.5rem] flex items-center justify-center">
                      {school.name.length > 10 ? school.name.substring(0, 10) + '...' : school.name}
                    </div>
                  </div>
                ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* スクール詳細モーダル */}
        {selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedSchool.name}
                </h3>
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">基本情報</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{selectedSchool.prefecture} {selectedSchool.city}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedSchool.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedSchool.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{selectedSchool.instructor_name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">レッスン情報</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>開催曜日: {selectedSchool.main_days.join(', ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>時間: {selectedSchool.main_time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-gray-400" />
                      <span>体験料金: ¥{selectedSchool.trial_price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-gray-400" />
                      <span>通常料金: ¥{selectedSchool.regular_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">先生の経歴</h4>
                  <p className="text-sm text-gray-700">{selectedSchool.instructor_bio}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">レッスン内容</h4>
                  <p className="text-sm text-gray-700">{selectedSchool.lesson_content}</p>
                </div>
              </div>

              {/* URLボタン */}
              {(selectedSchool.website_url || selectedSchool.instagram_url) && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">リンク</h4>
                  <div className="flex space-x-3">
                    {selectedSchool.website_url && (
                      <button
                        onClick={() => window.open(selectedSchool.website_url, '_blank')}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        <span>URL</span>
                      </button>
                    )}
                    {selectedSchool.instagram_url && (
                      <button
                        onClick={() => window.open(selectedSchool.instagram_url, '_blank')}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                      >
                        <span>📸</span>
                        <span>Instagram</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  閉じる
                </button>
                <button
                  onClick={() => setShowReservationForm(true)}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  体験予約メール送信
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 体験予約フォームモーダル */}
        {showReservationForm && selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  体験予約 - {selectedSchool.name}
                </h3>
                <button
                  onClick={() => {
                    setShowReservationForm(false);
                    setReservationForm({
                      name: '',
                      email: '',
                      phone: '',
                      preferredDate: '',
                      message: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    お名前 *
                  </label>
                  <input
                    type="text"
                    value={reservationForm.name}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    value={reservationForm.email}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={reservationForm.phone}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ご希望の日程
                  </label>
                  <input
                    type="text"
                    value={reservationForm.preferredDate}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                    placeholder="例: 来週の水曜日、土曜日の午後など"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ご質問・ご要望
                  </label>
                  <textarea
                    value={reservationForm.message}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    placeholder="体験レッスンについてのご質問やご要望があればお聞かせください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReservationForm(false);
                      setReservationForm({
                        name: '',
                        email: '',
                        phone: '',
                        preferredDate: '',
                        message: ''
                      });
                    }}
                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!reservationForm.name || !reservationForm.email) {
                        alert('お名前とメールアドレスは必須です');
                        return;
                      }

                      const subject = `体験レッスン予約のお問い合わせ - ${selectedSchool.name}`;
                      const body = `お世話になっております。

${selectedSchool.name}の体験レッスンについてお問い合わせいたします。

【希望内容】
・体験レッスンの予約
・詳細な日程や料金について

【お客様情報】
・お名前: ${reservationForm.name}
・メールアドレス: ${reservationForm.email}
・電話番号: ${reservationForm.phone || '未入力'}
・ご希望の日程: ${reservationForm.preferredDate || '未指定'}
・ご質問等: ${reservationForm.message || '特になし'}

よろしくお願いいたします。`;

                      const mailtoUrl = `mailto:${selectedSchool.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      window.open(mailtoUrl, '_blank');
                      
                      setShowReservationForm(false);
                      setReservationForm({
                        name: '',
                        email: '',
                        phone: '',
                        preferredDate: '',
                        message: ''
                      });
                    }}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    メール送信
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowerLessonMap;
