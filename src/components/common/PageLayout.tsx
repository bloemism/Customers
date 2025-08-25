import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = '',
  maxWidth = '7xl',
  padding = 'lg'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl'
  };

  const paddingClasses = {
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-8',
    xl: 'py-12'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 ${paddingClasses[padding]} ${className}`}>
        {children}
      </div>
    </div>
  );
};
