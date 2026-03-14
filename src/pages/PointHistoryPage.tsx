import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { ArrowLeft, TrendingUp, TrendingDown, Gift, Calendar } from 'lucide-react';
import type { PointHistory } from '../types/customer';

const FLOWER_LEVELS: { min: number; name: string; icon: string }[] = [
  { min: 0, name: 'シード', icon: '🌱' },
  { min: 500, name: 'スプラウト', icon: '🌿' },
  { min: 2000, name: 'ブルーム', icon: '🌸' },
  { min: 5000, name: 'ブロッサム', icon: '🌺' },
  { min: 10000, name: 'ローズ', icon: '🌹' },
  { min: 20000, name: 'ブーケ', icon: '💐' },
  { min: 50000, name: 'クラウン', icon: '👑' }
];

function getLevelInfo(totalEarned: number) {
  let current = FLOWER_LEVELS[0];
  let next = FLOWER_LEVELS[1];
  let levelIndex = 0;
  for (let i = FLOWER_LEVELS.length - 1; i >= 0; i--) {
    if (totalEarned >= FLOWER_LEVELS[i].min) {
      current = FLOWER_LEVELS[i];
      levelIndex = i;
      next = FLOWER_LEVELS[i + 1];
      break;
    }
  }
  const nextMin = next?.min ?? current.min;
  const rangeStart = current.min;
  const rangeEnd = next ? next.min : rangeStart + 10000;
  const progress = rangeEnd > rangeStart
    ? Math.min(100, ((totalEarned - rangeStart) / (rangeEnd - rangeStart)) * 100)
    : 100;
  return {
    current,
    next: next ?? null,
    levelIndex: levelIndex + 1,
    progress,
    rangeStart,
    rangeEnd
  };
}

const PointHistoryPage: React.FC = () => {
  const { customer, getPointHistory, loading: contextLoading } = useCustomer();
  const navigate = useNavigate();
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contextLoading) return;
    const fetchHistory = async () => {
      try {
        if (customer && (customer.id || customer.user_id)) {
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
  }, [customer, getPointHistory, contextLoading]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (contextLoading || loading) {
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

  const totalUsed = history
    .filter((item) => item.type === 'used')
    .reduce((sum, item) => sum + Math.abs(item.points), 0);

  const currentBalance = customer?.points ?? 0;
  const totalEarned = currentBalance + totalUsed;

  const levelInfo = getLevelInfo(totalEarned);
  const { current, next, levelIndex, progress, rangeEnd } = levelInfo;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
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
            <Gift className="w-6 h-6" style={{ color: '#5C6B4A' }} />
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
            貯めた合計をレベルとゲージで見える化
          </p>
        </div>

        {/* ロイヤリティレベル＆ゲージ */}
        <div
          className="mb-8 p-6 rounded-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0D6C8'
          }}
        >
          <p className="text-xs tracking-[0.2em] mb-3" style={{ color: '#8A857E' }}>
            LOYALTY LEVEL
          </p>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{current.icon}</span>
            <div>
              <p className="text-lg font-medium" style={{ color: '#2D2A26' }}>
                {current.name} (Lv.{levelIndex})
              </p>
              <p className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#5C6B4A', fontWeight: 600 }}>
                累計獲得 {totalEarned.toLocaleString()} pt
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: '#E0D6C8' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: '#5C6B4A'
                }}
              />
            </div>
            {next && (
              <p className="text-xs mt-2" style={{ color: '#8A857E' }}>
                次のレベルまで: {next.icon} {next.name} まであと {Math.max(0, rangeEnd - totalEarned).toLocaleString()} pt
              </p>
            )}
          </div>

          {/* レベル一覧（横スクロール） */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {FLOWER_LEVELS.map((lv, i) => {
              const reached = totalEarned >= lv.min;
              return (
                <div
                  key={lv.name}
                  className="flex-shrink-0 flex flex-col items-center p-2 rounded min-w-[4rem]"
                  style={{
                    backgroundColor: reached ? '#E8EDE4' : '#F5F0E8',
                    border: `1px solid ${reached ? '#5C6B4A' : '#E0D6C8'}`
                  }}
                >
                  <span className="text-lg">{lv.icon}</span>
                  <span className="text-xs mt-1" style={{ color: reached ? '#2D2A26' : '#8A857E' }}>
                    Lv.{i + 1}
                  </span>
                  <span className="text-xs" style={{ color: reached ? '#5C6B4A' : '#8A857E' }}>{lv.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 残ポイント / 累計獲得 / 累計使用 */}
        <div
          className="grid grid-cols-3 gap-4 mb-8 p-5 rounded-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div className="text-center">
            <p className="text-xs tracking-[0.1em] mb-2" style={{ color: '#8A857E' }}>残ポイント</p>
            <p className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#5C6B4A', fontWeight: 600 }}>
              {currentBalance.toLocaleString()} pt
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs tracking-[0.1em] mb-2" style={{ color: '#8A857E' }}>累計獲得</p>
            <p className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#3D4A35', fontWeight: 600 }}>
              {totalEarned.toLocaleString()} pt
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs tracking-[0.1em] mb-2" style={{ color: '#8A857E' }}>累計使用</p>
            <p className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#C4856C', fontWeight: 600 }}>
              {totalUsed.toLocaleString()} pt
            </p>
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
          <div className="px-6 py-4 border-b" style={{ borderColor: '#E0D6C8' }}>
            <p className="text-xs tracking-[0.2em]" style={{ color: '#8A857E' }}>
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
                  key={item.id ?? index}
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
                          <TrendingUp className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                        ) : (
                          <TrendingDown className="w-5 h-5" style={{ color: '#DC2626' }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: '#2D2A26' }}>
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

        {/* レベルシステム説明 */}
        <div
          className="mt-8 rounded-sm p-6"
          style={{
            backgroundColor: 'rgba(245,240,232,0.7)',
            border: '1px solid #E0D6C8'
          }}
        >
          <p className="text-xs tracking-[0.2em] mb-4" style={{ color: '#8A857E' }}>
            LEVEL SYSTEM
          </p>
          <ul className="text-sm space-y-2" style={{ color: '#5A5651' }}>
            {FLOWER_LEVELS.map((lv, i) => (
              <li key={lv.name}>
                <span className="mr-2">{lv.icon}</span>
                Lv.{i + 1} {lv.name}: {lv.min.toLocaleString()} pt ～
              </li>
            ))}
          </ul>
          <p className="text-xs mt-4" style={{ color: '#8A857E' }}>
            一度も引かずに貯めた合計ポイントでレベルが決まります。貯める楽しみを感じてください。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PointHistoryPage;
