import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Plus } from 'lucide-react';
import { LessonService, type LessonBooking } from '../services/lessonService';
import { useAuth } from '../contexts/AuthContext';

const LessonSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<LessonBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // 実際のデータベースからレッスン予約を取得
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await LessonService.getUserBookings(user.id);
        setBookings(data);
      } catch (error) {
        console.error('レッスン予約取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '予約済み';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      default:
        return '不明';
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">レッスンスケジュール</h1>
          </div>
          <button
            onClick={() => navigate('/lesson-map')}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            レッスン予約
          </button>
        </div>

        {/* 統計情報 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">予約済みレッスン</p>
              <p className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'scheduled').length}回
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">完了レッスン</p>
              <p className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'completed').length}回
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">総レッスン数</p>
              <p className="text-2xl font-bold text-purple-600">{bookings.length}回</p>
            </div>
          </div>
        </div>

        {/* レッスンリスト */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">レッスン一覧</h2>
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">まだレッスンの予約がありません</p>
              <p className="text-sm text-gray-500 mt-2">
                フラワーレッスンマップからレッスンを予約してください
              </p>
              <button
                onClick={() => navigate('/lesson-map')}
                className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                レッスンを探す
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {bookings.map((booking, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          フラワーレッスン #{booking.lesson_id}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {booking.created_at && formatDate(booking.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        予約日: {formatDate(booking.scheduled_date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        時間: {formatTime(booking.scheduled_date)}
                      </span>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors">
                        詳細を見る
                      </button>
                      {booking.status === 'scheduled' && (
                        <>
                          <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md text-sm hover:bg-green-700 transition-colors">
                            完了にする
                          </button>
                          <button className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md text-sm hover:bg-red-700 transition-colors">
                            キャンセル
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* レッスン予約について */}
        <div className="mt-6 bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">レッスン予約について</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-purple-800 mb-2">予約方法</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• フラワーレッスンマップからスクールを選択</li>
                <li>• 体験レッスンまたは継続レッスンを予約</li>
                <li>• マイQRコードを先生に見せて登録</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">レッスン管理</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• 予約したレッスンはここで管理</li>
                <li>• レッスン完了後は先生が更新</li>
                <li>• キャンセルは事前にご連絡ください</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonSchedulePage;
