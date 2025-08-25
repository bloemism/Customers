import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  bgGradient?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  bgGradient = 'from-blue-500 to-purple-600',
  showBackButton = true,
  onBackClick
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate('/menu');
    }
  };

  return (
    <div className={`bg-gradient-to-r ${bgGradient} shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="p-2 text-white/80 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            )}
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <div className="text-white">
                {icon}
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-sm text-white/80">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
