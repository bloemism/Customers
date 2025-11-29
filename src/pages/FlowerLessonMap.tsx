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

  // 控えめなパステルで鮮やかな色を生成する関数
  const getRandomColor = (id: string) => {
    // 控えめなパステルで鮮やかな色（濃く、控えめにパステルに鮮やかに）
    const colors = [
      { bg: '#C8E6C9', border: '#A5D6A7', text: '#2E7D32' }, // パステルグリーン（濃い）
      { bg: '#FFCCBC', border: '#FFAB91', text: '#D84315' }, // パステルオレンジ（濃い）
      { bg: '#E1BEE7', border: '#CE93D8', text: '#7B1FA2' }, // パステルパープル（濃い）
      { bg: '#BBDEFB', border: '#90CAF9', text: '#1565C0' }, // パステルブルー（濃い）
      { bg: '#FFE0B2', border: '#FFCC80', text: '#E65100' }, // パステルアンバー（濃い）
      { bg: '#F8BBD0', border: '#F48FB1', text: '#C2185B' }, // パステルピンク（濃い）
      { bg: '#B2DFDB', border: '#80CBC4', text: '#00695C' }, // パステルティール（濃い）
      { bg: '#D1C4E9', border: '#B39DDB', text: '#512DA8' }  // パステルインディゴ（濃い）
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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FAF8F5' }}
      >
        <div className="text-center">
          <div 
            className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: '#E0D6C8', borderTopColor: '#5C6B4A' }}
          />
          <p className="mt-4 text-sm" style={{ color: '#2D2A26', fontWeight: 600 }}>
            レッスンスクール情報を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* ヘッダー */}
        <div 
          className="rounded-sm p-4 sm:p-6 mb-6 sm:mb-8"
          style={{ 
            background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 50%, #D4AF37 100%)',
            border: '2px solid #B8941F',
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-1.5 sm:p-2 transition-colors"
                style={{ color: '#2D2A26' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1A1815';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#2D2A26';
                }}
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div>
                <h1 
                  className="text-lg sm:text-xl md:text-2xl"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2D2A26',
                    fontWeight: 700,
                    textShadow: '0 1px 2px rgba(255,255,255,0.3)'
                  }}
                >
                  フラワーレッスンマップ
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: '#2D2A26', fontWeight: 600 }}>
                  全国のフラワーレッスンスクールを探す
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* 左側：フィルター・検索 */}
          <div className="lg:col-span-1">
            <div 
              className="rounded-sm p-4 sm:p-6"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid #E0D6C8'
              }}
            >
              <h2 
                className="text-lg mb-4"
                style={{ 
                  fontFamily: "'Noto Serif JP', serif",
                  color: '#2D2A26',
                  fontWeight: 600
                }}
              >
                検索・フィルター
              </h2>
              
              {/* 検索バー */}
              <div className="mb-4">
                <label 
                  className="block text-sm mb-2"
                  style={{ color: '#2D2A26', fontWeight: 600 }}
                >
                  スクール名・地域で検索
                </label>
                <div className="relative">
                  <Search 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                    style={{ color: '#3D3A36', fontWeight: 500 }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="スクール名、県、市を入力..."
                    className="w-full pl-10 pr-4 py-3 rounded-sm transition-all duration-200"
                    style={{
                      backgroundColor: '#FDFCFA',
                      border: '2px solid #E0D6C8',
                      color: '#2D2A26',
                      fontWeight: 500,
                      fontFamily: "'Noto Serif JP', serif",
                      fontSize: '14px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5C6B4A';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E0D6C8';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* 地域フィルター */}
              <div className="mb-4">
                <label 
                  className="block text-sm mb-2"
                  style={{ color: '#2D2A26', fontWeight: 600 }}
                >
                  地域で絞り込み
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-3 rounded-sm transition-all duration-200"
                  style={{
                    backgroundColor: '#FDFCFA',
                    border: '2px solid #E0D6C8',
                    color: '#3D3A36',
                    fontFamily: "'Noto Serif JP', serif",
                    fontSize: '14px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5C6B4A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0D6C8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
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
              <div className="text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>
                表示件数: {filteredSchools.length}件
              </div>
            </div>
          </div>

          {/* 右側：スクール一覧 */}
          <div className="lg:col-span-2">
            <div 
              className="rounded-sm p-4 sm:p-6"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid #E0D6C8'
              }}
            >
              <h2 
                className="text-lg mb-4"
                style={{ 
                  fontFamily: "'Noto Serif JP', serif",
                  color: '#2D2A26',
                  fontWeight: 600
                }}
              >
                レッスンスクール一覧
              </h2>
              
                            {filteredSchools.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: '#E0D6C8' }} />
                  <p style={{ color: '#2D2A26', fontWeight: 600 }}>条件に合うレッスンスクールが見つかりません</p>
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
                        <div 
                          key={region.id} 
                          className="rounded-sm p-4"
                          style={{ 
                            border: '1px solid #E0D6C8',
                            backgroundColor: '#FDFCFA'
                          }}
                        >
                          <h3 
                            className="text-lg mb-3 pb-2"
                            style={{ 
                              fontFamily: "'Noto Serif JP', serif",
                              color: '#2D2A26',
                              fontWeight: 600,
                              borderBottom: '1px solid #E0D6C8'
                            }}
                          >
                            {region.name} ({schoolsInRegion.length}校)
                          </h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-1">
                {schoolsInRegion.map(school => {
                  const colors = getRandomColor(school.id);
                  return (
                  <div
                    key={school.id}
                    className="rounded-sm transition-all cursor-pointer text-center shadow-sm hover:shadow-lg transform hover:scale-105"
                    style={{
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                      padding: '0.5rem 0.25rem'
                    }}
                    onClick={() => setSelectedSchool(school)}
                    title={`${school.name} (${school.prefecture} ${school.city})`}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }}
                  >
                    <div 
                      className="text-[10px] font-medium leading-tight min-h-[2.5rem] flex items-center justify-center"
                      style={{ 
                        color: colors.text,
                        fontWeight: 600
                      }}
                    >
                      {school.name.length > 10 ? school.name.substring(0, 10) + '...' : school.name}
                    </div>
                  </div>
                );
                })}
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
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(45, 42, 38, 0.5)' }}
            onClick={() => setSelectedSchool(null)}
          >
            <div 
              className="rounded-sm p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto"
              style={{ 
                backgroundColor: '#FAF8F5',
                border: '1px solid #E0D6C8',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 
                  className="text-xl"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2D2A26',
                    fontWeight: 600
                  }}
                >
                  {selectedSchool.name}
                </h3>
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="text-2xl leading-none transition-colors"
                  style={{ color: '#8A857E' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#3D3A36';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#8A857E';
                  }}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 
                    className="mb-2"
                    style={{ 
                      fontFamily: "'Noto Serif JP', serif",
                      color: '#2D2A26',
                      fontWeight: 600
                    }}
                  >
                    基本情報
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" style={{ color: '#8A857E' }} />
                      <span style={{ color: '#2D2A26', fontWeight: 600 }}>
                        {selectedSchool.prefecture} {selectedSchool.city}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" style={{ color: '#8A857E' }} />
                      <span style={{ color: '#2D2A26', fontWeight: 600 }}>{selectedSchool.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" style={{ color: '#8A857E' }} />
                      <span style={{ color: '#2D2A26', fontWeight: 600 }}>{selectedSchool.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" style={{ color: '#8A857E' }} />
                      <span style={{ color: '#2D2A26', fontWeight: 600 }}>{selectedSchool.instructor_name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 
                    className="mb-2"
                    style={{ 
                      fontFamily: "'Noto Serif JP', serif",
                      color: '#2D2A26',
                      fontWeight: 600
                    }}
                  >
                    レッスン情報
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" style={{ color: '#8A857E' }} />
                      <span style={{ color: '#2D2A26', fontWeight: 600 }}>
                        開催曜日: {selectedSchool.main_days.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" style={{ color: '#8A857E' }} />
                      <span style={{ color: '#2D2A26', fontWeight: 600 }}>時間: {selectedSchool.main_time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4" style={{ color: '#8A857E' }} />
                      <span style={{ color: '#2D2A26', fontWeight: 600 }}>
                        体験料金: ¥{selectedSchool.trial_price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4" style={{ color: '#8A857E' }} />
                      <span style={{ color: '#2D2A26', fontWeight: 600 }}>
                        通常料金: ¥{selectedSchool.regular_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 
                    className="mb-2"
                    style={{ 
                      fontFamily: "'Noto Serif JP', serif",
                      color: '#2D2A26',
                      fontWeight: 600
                    }}
                  >
                    先生の経歴
                  </h4>
                  <p className="text-sm" style={{ color: '#2D2A26', fontWeight: 500, lineHeight: '1.6' }}>
                    {selectedSchool.instructor_bio}
                  </p>
                </div>

                <div>
                  <h4 
                    className="mb-2"
                    style={{ 
                      fontFamily: "'Noto Serif JP', serif",
                      color: '#2D2A26',
                      fontWeight: 600
                    }}
                  >
                    レッスン内容
                  </h4>
                  <p className="text-sm" style={{ color: '#2D2A26', fontWeight: 500, lineHeight: '1.6' }}>
                    {selectedSchool.lesson_content}
                  </p>
                </div>
              </div>

              {/* URLボタン */}
              {(selectedSchool.website_url || selectedSchool.instagram_url) && (
                <div className="mt-4">
                  <h4 
                    className="mb-3"
                    style={{ 
                      fontFamily: "'Noto Serif JP', serif",
                      color: '#2D2A26',
                      fontWeight: 600
                    }}
                  >
                    リンク
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {selectedSchool.website_url && (
                      <button
                        onClick={() => window.open(selectedSchool.website_url, '_blank')}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 rounded-sm transition-colors"
                        style={{ 
                          backgroundColor: '#5C6B4A',
                          color: '#FAF8F5',
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4A5D4A';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#5C6B4A';
                        }}
                      >
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">URL</span>
                      </button>
                    )}
                    {selectedSchool.instagram_url && (
                      <button
                        onClick={() => window.open(selectedSchool.instagram_url, '_blank')}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 rounded-sm transition-colors"
                        style={{ 
                          backgroundColor: '#C4856C',
                          color: '#FAF8F5',
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#B0755A';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#C4856C';
                        }}
                      >
                        <span>📸</span>
                        <span className="text-sm">Instagram</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="flex-1 py-3 px-4 rounded-sm transition-colors text-sm sm:text-base"
                  style={{ 
                    backgroundColor: '#F5F0E8',
                    color: '#5A5651',
                    border: '1px solid #E0D6C8',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E8E0D8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5F0E8';
                  }}
                >
                  閉じる
                </button>
                <button
                  onClick={() => setShowReservationForm(true)}
                  className="flex-1 py-3 px-4 rounded-sm transition-colors flex items-center justify-center text-sm sm:text-base"
                  style={{ 
                    backgroundColor: '#5C6B4A',
                    color: '#FAF8F5',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4A5D4A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#5C6B4A';
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">体験予約メール送信</span>
                  <span className="sm:hidden">予約</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 体験予約フォームモーダル */}
        {showReservationForm && selectedSchool && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(45, 42, 38, 0.5)' }}
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
          >
            <div 
              className="rounded-sm p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4"
              style={{ 
                backgroundColor: '#FAF8F5',
                border: '1px solid #E0D6C8',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 
                  className="text-lg"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2D2A26',
                    fontWeight: 600
                  }}
                >
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
                  className="text-2xl leading-none transition-colors"
                  style={{ color: '#8A857E' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#3D3A36';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#8A857E';
                  }}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    お名前 *
                  </label>
                  <input
                    type="text"
                    value={reservationForm.name}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-3 rounded-sm transition-all duration-200"
                    style={{
                      backgroundColor: '#FDFCFA',
                      border: '2px solid #E0D6C8',
                      color: '#2D2A26',
                      fontWeight: 500,
                      fontFamily: "'Noto Serif JP', serif",
                      fontSize: '14px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5C6B4A';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E0D6C8';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    value={reservationForm.email}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-3 rounded-sm transition-all duration-200"
                    style={{
                      backgroundColor: '#FDFCFA',
                      border: '2px solid #E0D6C8',
                      color: '#2D2A26',
                      fontWeight: 500,
                      fontFamily: "'Noto Serif JP', serif",
                      fontSize: '14px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5C6B4A';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E0D6C8';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={reservationForm.phone}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-3 rounded-sm transition-all duration-200"
                    style={{
                      backgroundColor: '#FDFCFA',
                      border: '2px solid #E0D6C8',
                      color: '#2D2A26',
                      fontWeight: 500,
                      fontFamily: "'Noto Serif JP', serif",
                      fontSize: '14px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5C6B4A';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E0D6C8';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    ご希望の日程
                  </label>
                  <input
                    type="text"
                    value={reservationForm.preferredDate}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                    placeholder="例: 来週の水曜日、土曜日の午後など"
                    className="w-full px-3 py-3 rounded-sm transition-all duration-200"
                    style={{
                      backgroundColor: '#FDFCFA',
                      border: '2px solid #E0D6C8',
                      color: '#2D2A26',
                      fontWeight: 500,
                      fontFamily: "'Noto Serif JP', serif",
                      fontSize: '14px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5C6B4A';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E0D6C8';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ color: '#2D2A26', fontWeight: 600 }}
                  >
                    ご質問・ご要望
                  </label>
                  <textarea
                    value={reservationForm.message}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    placeholder="体験レッスンについてのご質問やご要望があればお聞かせください"
                    className="w-full px-3 py-3 rounded-sm transition-all duration-200"
                    style={{
                      backgroundColor: '#FDFCFA',
                      border: '2px solid #E0D6C8',
                      color: '#2D2A26',
                      fontWeight: 500,
                      fontFamily: "'Noto Serif JP', serif",
                      fontSize: '14px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5C6B4A';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E0D6C8';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                    className="flex-1 py-3 px-4 rounded-sm transition-colors text-sm sm:text-base"
                    style={{ 
                      backgroundColor: '#F5F0E8',
                      color: '#5A5651',
                      border: '1px solid #E0D6C8',
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#E8E0D8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#F5F0E8';
                    }}
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
                    className="flex-1 py-3 px-4 rounded-sm transition-colors flex items-center justify-center text-sm sm:text-base"
                    style={{ 
                      backgroundColor: '#5C6B4A',
                      color: '#FAF8F5',
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4A5D4A';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#5C6B4A';
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">メール送信</span>
                    <span className="sm:hidden">送信</span>
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
