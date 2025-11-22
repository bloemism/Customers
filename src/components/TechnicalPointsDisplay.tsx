import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { Star, TrendingUp, Award, Target } from 'lucide-react';

interface TechnicalLevel {
  id: string;
  customer_id: string;
  lesson_school_id: string;
  lesson_school_name: string;
  total_points: number;
  current_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  level_achieved_at: string;
}

const TECHNICAL_LEVELS = {
  BEGINNER: { 
    minPoints: 0, 
    maxPoints: 119, 
    name: '初心者', 
    color: 'bg-gray-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    nextLevel: 'INTERMEDIATE'
  },
  INTERMEDIATE: { 
    minPoints: 120, 
    maxPoints: 299, 
    name: '中級者', 
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    nextLevel: 'ADVANCED'
  },
  ADVANCED: { 
    minPoints: 300, 
    maxPoints: 499, 
    name: '上級者', 
    color: 'bg-purple-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    nextLevel: 'EXPERT'
  },
  EXPERT: { 
    minPoints: 500, 
    maxPoints: Infinity, 
    name: 'エキスパート', 
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    nextLevel: null
  }
};

const TechnicalPointsDisplay: React.FC = () => {
  const { getTechnicalLevels } = useCustomerAuth();
  const [technicalLevels, setTechnicalLevels] = useState<TechnicalLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTechnicalLevels = async () => {
      try {
        const levels = await getTechnicalLevels();
        setTechnicalLevels(levels);
      } catch (error) {
        console.error('技術レベル読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTechnicalLevels();
  }, [getTechnicalLevels]);

  const getLevelConfig = (level: string) => {
    return TECHNICAL_LEVELS[level as keyof typeof TECHNICAL_LEVELS] || TECHNICAL_LEVELS.BEGINNER;
  };

  const getProgressPercentage = (currentPoints: number, level: string) => {
    const config = getLevelConfig(level);
    if (config.nextLevel === null) return 100; // EXPERT level
    
    const nextConfig = TECHNICAL_LEVELS[config.nextLevel as keyof typeof TECHNICAL_LEVELS];
    const progress = ((currentPoints - config.minPoints) / (nextConfig.minPoints - config.minPoints)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getNextLevelPoints = (currentPoints: number, level: string) => {
    const config = getLevelConfig(level);
    if (config.nextLevel === null) return null;
    
    const nextConfig = TECHNICAL_LEVELS[config.nextLevel as keyof typeof TECHNICAL_LEVELS];
    return nextConfig.minPoints - currentPoints;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (technicalLevels.length === 0) {
    return (
      <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-cyan-600" />
          技術レベル
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>技術レベルがありません</p>
          <p className="text-sm mt-2">レッスンに参加して技術ポイントを獲得しましょう</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Star className="w-5 h-5 mr-2 text-cyan-600" />
        技術レベル
      </h3>
      
      <div className="space-y-4">
        {technicalLevels.map((level) => {
          const config = getLevelConfig(level.current_level);
          const progressPercentage = getProgressPercentage(level.total_points, level.current_level);
          const nextLevelPoints = getNextLevelPoints(level.total_points, level.current_level);
          
          return (
            <div key={level.id} className="bg-white rounded-lg p-4 border border-cyan-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{level.lesson_school_name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                      <Award className="w-3 h-3 mr-1" />
                      {config.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {level.total_points} ポイント
                    </span>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-cyan-600" />
              </div>
              
              {/* プログレスバー */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{config.minPoints}pt</span>
                  {config.nextLevel && (
                    <span>{TECHNICAL_LEVELS[config.nextLevel as keyof typeof TECHNICAL_LEVELS].minPoints}pt</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${config.color} transition-all duration-500`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* 次のレベルまでのポイント */}
              {nextLevelPoints && nextLevelPoints > 0 && (
                <p className="text-xs text-gray-500">
                  次のレベルまで {nextLevelPoints} ポイント
                </p>
              )}
              
              {config.nextLevel === null && (
                <p className="text-xs text-yellow-600 font-medium">
                  🎉 最高レベル達成！
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TechnicalPointsDisplay;

