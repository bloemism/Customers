import React from 'react';

const LEVEL_NAMES: Record<number, string> = {
  1: 'シード',
  2: 'ブルーマー',
  3: 'ブルーマー',
  4: 'ガーデナー',
  5: 'ガーデナー',
  6: 'ガーデナー',
  7: 'フラワーアーティスト',
  8: 'フラワーアーティスト',
  9: 'フラワーアーティスト',
  10: 'マスターフローリスト'
};

const LEVEL_ICONS: Record<number, string> = {
  1: '🌱',
  2: '🌸',
  3: '🌸',
  4: '🌲',
  5: '🌲',
  6: '🌲',
  7: '✨',
  8: '✨',
  9: '✨',
  10: '👑'
};

function getLevelInfo(level: number) {
  const name = LEVEL_NAMES[level] ?? LEVEL_NAMES[10];
  const icon = LEVEL_ICONS[level] ?? LEVEL_ICONS[10];
  return { name, icon };
}

interface LessonXPBarProps {
  totalPoints: number;
  currentLevel: number;
  /** 表示用の受講回数（任意） */
  lessonsAttended?: number;
}

const LessonXPBar: React.FC<LessonXPBarProps> = ({
  totalPoints,
  currentLevel,
  lessonsAttended
}) => {
  const { name, icon } = getLevelInfo(currentLevel);
  const pointsInLevel = totalPoints % 100;
  const progressPercent = Math.min(100, (pointsInLevel / 100) * 100);

  return (
    <div
      className="rounded-sm p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        border: '1px solid #E0D6C8'
      }}
    >
      <p className="text-xs tracking-[0.1em] mb-2" style={{ color: '#8A857E' }}>
        レッスン経験値
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xl" aria-hidden>{icon}</span>
        <div>
          <p className="text-sm font-medium" style={{ color: '#2D2A26' }}>
            Lv.{currentLevel} {name}
          </p>
          <p className="text-lg font-semibold" style={{ color: '#5C6B4A' }}>
            {totalPoints} XP
          </p>
        </div>
        {typeof lessonsAttended === 'number' && (
          <p className="text-xs" style={{ color: '#8A857E' }}>
            レッスン受講 {lessonsAttended}回
          </p>
        )}
      </div>
      <div className="mt-3">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: '#E0D6C8' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: '#5C6B4A'
            }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: '#8A857E' }}>
          次レベルまで {100 - pointsInLevel} XP
        </p>
      </div>
    </div>
  );
};

export default LessonXPBar;
