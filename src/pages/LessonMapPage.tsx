import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, ArrowLeft, Search, BookOpen } from 'lucide-react';
import { LessonService, type FlowerLesson } from '../services/lessonService';

const LessonMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<FlowerLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<FlowerLesson | null>(null);

  // 実際のデータベースからフラワーレッスンを取得
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const data = await LessonService.getAllLessons();
        setLessons(data);
      } catch (error) {
        console.error('フラワーレッスン取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const filteredLessons = lessons.filter(lesson =>
    lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lesson.address && lesson.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <p className="mt-4 text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* ヘッダー */}
      <div 
        className="border-b"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#E0D6C8'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/customer-menu')}
              className="mr-4 p-2 transition-colors"
              style={{ color: '#5A5651' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#3D3A36';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#5A5651';
              }}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 
              className="text-2xl"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26',
                fontWeight: 600
              }}
            >
              フラワーレッスンマップ
            </h1>
          </div>

          {/* 検索バー */}
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" 
              style={{ color: '#8A857E' }}
            />
            <input
              type="text"
              placeholder="スクール名や住所で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-sm transition-all duration-200"
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
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 地図プレースホルダー */}
        <div 
          className="rounded-sm p-6 mb-6"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div 
            className="rounded-sm h-64 flex items-center justify-center"
            style={{ backgroundColor: '#F5F0E8' }}
          >
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-2" style={{ color: '#8A857E' }} />
              <p style={{ color: '#3D3A36', fontWeight: 500 }}>地図がここに表示されます</p>
              <p className="text-sm mt-1" style={{ color: '#8A857E' }}>Google Maps API統合予定</p>
            </div>
          </div>
        </div>

        {/* スクールリスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson, index) => {
            // カラフルな色を控えめなトーンに調整
            const colorPalette = [
              { bg: '#E8EDE4', border: '#D1DBC9', text: '#5C6B4A', button: '#5C6B4A', buttonHover: '#4A5D4A' }, // モスグリーン
              { bg: '#F5EBE6', border: '#E8D5CC', text: '#C4856C', button: '#C4856C', buttonHover: '#B0755A' }, // テラコッタ
              { bg: '#F0E8E4', border: '#E0D6C8', text: '#8A6F5E', button: '#8A6F5E', buttonHover: '#7A5F4E' }, // ベージュブラウン
              { bg: '#E8E8E4', border: '#D1D1C9', text: '#6B6B5A', button: '#6B6B5A', buttonHover: '#5A5A4A' }, // オリーブ
              { bg: '#F5E8E8', border: '#E8D5D5', text: '#8A6F6F', button: '#8A6F6F', buttonHover: '#7A5F5F' }, // ローズ
              { bg: '#E8E8ED', border: '#D5D5E0', text: '#6F6F8A', button: '#6F6F8A', buttonHover: '#5F5F7A' }  // ラベンダー
            ];
            const colors = colorPalette[index % colorPalette.length];
            
            return (
              <div
                key={lesson.id}
                className="rounded-sm transition-all duration-300 cursor-pointer"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onClick={() => setSelectedLesson(lesson)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="p-6">
                  <h3 
                    className="text-lg mb-2"
                    style={{ 
                      fontFamily: "'Noto Serif JP', serif",
                      color: '#2D2A26',
                      fontWeight: 600
                    }}
                  >
                    {lesson.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#8A857E' }} />
                      <p className="text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>{lesson.address}</p>
                    </div>
                    
                    {lesson.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: '#8A857E' }} />
                        <p className="text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>{lesson.phone}</p>
                      </div>
                    )}
                    
                    {lesson.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: '#8A857E' }} />
                        <p className="text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>{lesson.email}</p>
                      </div>
                    )}
                  </div>

                  {lesson.description && (
                    <p 
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: '#5A5651', fontWeight: 400 }}
                    >
                      {lesson.description}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    <button 
                      className="flex-1 py-2 px-3 rounded-sm text-sm transition-colors"
                      style={{ 
                        backgroundColor: colors.button,
                        color: '#FAF8F5',
                        fontWeight: 500
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.buttonHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.button;
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLesson(lesson);
                      }}
                    >
                      詳細を見る
                    </button>
                    <button 
                      className="flex-1 py-2 px-3 rounded-sm text-sm transition-colors"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        // 体験予約の処理
                      }}
                    >
                      体験予約
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredLessons.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: '#3D3A36', fontWeight: 500 }}>該当するスクールが見つかりませんでした。</p>
          </div>
        )}
      </div>

      {/* スクール詳細モーダル */}
      {selectedLesson && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(45, 42, 38, 0.5)' }}
          onClick={() => setSelectedLesson(null)}
        >
          <div 
            className="rounded-sm max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: '#FAF8F5',
              border: '1px solid #E0D6C8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 
                  className="text-xl"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2D2A26',
                    fontWeight: 600
                  }}
                >
                  {selectedLesson.name}
                </h2>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="text-2xl leading-none transition-colors"
                  style={{ color: '#8A857E' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#3D3A36';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#8A857E';
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 
                    className="mb-2"
                    style={{ 
                      fontFamily: "'Noto Serif JP', serif",
                      color: '#2D2A26',
                      fontWeight: 600
                    }}
                  >
                    スクール情報
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#8A857E' }} />
                      <p style={{ color: '#3D3A36', fontWeight: 500 }}>{selectedLesson.address}</p>
                    </div>
                    {selectedLesson.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: '#8A857E' }} />
                        <p style={{ color: '#3D3A36', fontWeight: 500 }}>{selectedLesson.phone}</p>
                      </div>
                    )}
                    {selectedLesson.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: '#8A857E' }} />
                        <p style={{ color: '#3D3A36', fontWeight: 500 }}>{selectedLesson.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedLesson.description && (
                  <div>
                    <h3 
                      className="mb-2"
                      style={{ 
                        fontFamily: "'Noto Serif JP', serif",
                        color: '#2D2A26',
                        fontWeight: 600
                      }}
                    >
                      スクール紹介
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: '#3D3A36', fontWeight: 400, lineHeight: '1.6' }}
                    >
                      {selectedLesson.description}
                    </p>
                  </div>
                )}

                <div className="pt-4" style={{ borderTop: '1px solid #E0D6C8' }}>
                  <div className="flex space-x-3">
                    <button 
                      className="flex-1 py-3 px-4 rounded-sm transition-colors"
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
                      体験予約
                    </button>
                    <button 
                      className="flex-1 py-3 px-4 rounded-sm transition-colors"
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
                      お問い合わせ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonMapPage;
