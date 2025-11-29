import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { ArrowLeft, TrendingUp, TrendingDown, Gift, Calendar, Star } from 'lucide-react';
import type { PointHistory } from '../types/customer';

// 背景画像
const BG_IMAGE = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

const PointHistoryPage: React.FC = () => {
  const { customer, getPointHistory } = useCustomer();
  const navigate = useNavigate();
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (customer && customer.id) {
          const data = await getPointHistory();
          setHistory(data);
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error('ポイント履歴の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [customer, getPointHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <p className="mt-4 text-sm" style={{ color: '#8A857E' }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  const totalEarned = history
    .filter(item => item.type === 'earned')
    .reduce((sum, item) => sum + item.points, 0);

  const totalUsed = history
    .filter(item => item.type === 'used')
    .reduce((sum, item) => sum + Math.abs(item.points), 0);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 無地背景 */}

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/customer-menu')}
            className="flex items-center gap-2 text-sm transition-all duration-300 mb-6"
            style={{ color: '#5A5651' }}
          >
            <ArrowLeft className="w-4 h-4" />
            メニューへ戻る
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Star className="w-6 h-6" style={{ color: '#5C6B4A' }} />
            <h1 
              className="text-2xl"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26'
              }}
            >
              ポイント履歴
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#8A857E' }}>
            ポイントの獲得・使用履歴
          </p>
        </div>

        {/* ポイント情報 */}
        <div 
          className="grid grid-cols-3 gap-4 mb-8 p-6 rounded-sm"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div className="text-center">
            <p 
              className="text-xs tracking-[0.1em] mb-2"
              style={{ color: '#8A857E' }}
            >
              現在のポイント
            </p>
            <p 
              className="text-3xl"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                color: '#5C6B4A',
                fontWeight: 600
              }}
            >
              {customer?.points || 0}
            </p>
            <p className="text-xs" style={{ color: '#8A857E' }}>pt</p>
          </div>
          <div className="text-center">
            <p 
              className="text-xs tracking-[0.1em] mb-2"
              style={{ color: '#8A857E' }}
            >
              レベル
            </p>
            <p 
              className="text-xl"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#3D4A35',
                fontWeight: 500
              }}
            >
              {customer?.level || 'BASIC'}
            </p>
          </div>
          <div className="text-center">
            <p 
              className="text-xs tracking-[0.1em] mb-2"
              style={{ color: '#8A857E' }}
            >
              総獲得ポイント
            </p>
            <p 
              className="text-3xl"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                color: '#C4856C',
                fontWeight: 600
              }}
            >
              {totalEarned}
            </p>
            <p className="text-xs" style={{ color: '#8A857E' }}>pt</p>
          </div>
        </div>

        {/* 履歴リスト */}
        <div 
          className="rounded-sm overflow-hidden"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div 
            className="px-6 py-4 border-b"
            style={{ borderColor: '#E0D6C8' }}
          >
            <p 
              className="text-xs tracking-[0.2em]"
              style={{ color: '#8A857E' }}
            >
              POINT HISTORY
            </p>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#F5F0E8' }}
              >
                <Gift className="w-8 h-8" style={{ color: '#8A857E' }} />
              </div>
              <p style={{ color: '#5A5651' }}>まだポイント履歴がありません</p>
              <p className="text-sm mt-2" style={{ color: '#8A857E' }}>
                店舗でお買い物をするとポイントが貯まります
              </p>
            </div>
          ) : (
            <div>
              {history.map((item, index) => (
                <div 
                  key={index} 
                  className="p-6 transition-colors hover:bg-[#FDFCFA]"
                  style={{ 
                    borderBottom: index < history.length - 1 ? '1px solid #E0D6C8' : 'none'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: item.type === 'earned' ? '#E8EDE4' : '#FEE2E2'
                        }}
                      >
                        {item.type === 'earned' ? (
                          <TrendingUp 
                            className="w-5 h-5" 
                            style={{ color: '#5C6B4A' }} 
                          />
                        ) : (
                          <TrendingDown 
                            className="w-5 h-5" 
                            style={{ color: '#DC2626' }} 
                          />
                        )}
                      </div>
                      <div>
                        <p 
                          className="text-sm"
                          style={{ color: '#2D2A26' }}
                        >
                          {item.reason}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" style={{ color: '#8A857E' }} />
                          <span className="text-xs" style={{ color: '#8A857E' }}>
                            {item.created_at && formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p 
                        className="text-xl"
                        style={{ 
                          fontFamily: "'Cormorant Garamond', serif",
                          color: item.type === 'earned' ? '#5C6B4A' : '#DC2626',
                          fontWeight: 600
                        }}
                      >
                        {item.type === 'earned' ? '+' : ''}{item.points} pt
                      </p>
                      <p className="text-xs" style={{ color: '#8A857E' }}>
                        {item.type === 'earned' ? '獲得' : '使用'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ポイントシステム説明 */}
        <div 
          className="mt-8 rounded-sm p-6"
          style={{ 
            backgroundColor: 'rgba(245,240,232,0.7)',
            border: '1px solid #E0D6C8'
          }}
        >
          <p 
            className="text-xs tracking-[0.2em] mb-4"
            style={{ color: '#8A857E' }}
          >
            POINT SYSTEM
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p 
                className="text-sm mb-2"
                style={{ color: '#5C6B4A', fontWeight: 500 }}
              >
                ポイント獲得
              </p>
              <ul className="text-sm space-y-1" style={{ color: '#5A5651' }}>
                <li>• 購入金額の5%がポイントとして付与</li>
                <li>• 全国の加盟店舗で利用可能</li>
                <li>• ポイントは即座に反映されます</li>
              </ul>
            </div>
            <div>
              <p 
                className="text-sm mb-2"
                style={{ color: '#5C6B4A', fontWeight: 500 }}
              >
                ポイント使用
              </p>
              <ul className="text-sm space-y-1" style={{ color: '#5A5651' }}>
                <li>• 1ポイント = 1円として使用可能</li>
                <li>• 1回の使用限度：最大1,500ポイント</li>
                <li>• 繁忙期は使用制限があります</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointHistoryPage;
