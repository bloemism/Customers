import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  icon,
  variant = 'default',
  padding = 'md'
}) => {
  const variantClasses = {
    default: 'bg-white shadow-md border border-gray-200',
    elevated: 'bg-white shadow-lg border-0',
    outlined: 'bg-white shadow-sm border-2 border-gray-300'
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`${variantClasses[variant]} rounded-lg ${paddingClasses[padding]} ${className}`}>
      {(title || icon) && (
        <div className="mb-4">
          {icon && (
            <div className="flex items-center mb-2">
              <div className="text-gray-600 mr-2">
                {icon}
              </div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
            </div>
          )}
          {title && !icon && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
