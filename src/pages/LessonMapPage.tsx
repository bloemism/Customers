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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">フラワーレッスンマップ</h1>
          </div>

          {/* 検索バー */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="スクール名や住所で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 地図プレースホルダー */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">地図がここに表示されます</p>
              <p className="text-sm text-gray-500">Google Maps API統合予定</p>
            </div>
          </div>
        </div>

        {/* スクールリスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedLesson(lesson)}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{lesson.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{lesson.address}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{lesson.phone}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{lesson.email}</p>
                  </div>
                </div>

                {lesson.description && (
                  <p className="text-sm text-gray-700 mb-4">{lesson.description}</p>
                )}

                <div className="flex space-x-2">
                  <button className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-md text-sm hover:bg-purple-700 transition-colors">
                    詳細を見る
                  </button>
                  <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md text-sm hover:bg-green-700 transition-colors">
                    体験予約
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLessons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">該当するスクールが見つかりませんでした。</p>
          </div>
        )}
      </div>

      {/* スクール詳細モーダル */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{selectedLesson.name}</h2>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">スクール情報</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600">{selectedLesson.address}</p>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <p className="text-gray-600">{selectedLesson.phone}</p>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <p className="text-gray-600">{selectedLesson.email}</p>
                    </div>
                  </div>
                </div>

                {selectedLesson.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">スクール紹介</h3>
                    <p className="text-sm text-gray-600">{selectedLesson.description}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                      体験予約
                    </button>
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
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
