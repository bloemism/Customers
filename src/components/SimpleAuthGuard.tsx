import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';

interface SimpleAuthGuardProps {
  children: React.ReactNode;
}

export const SimpleAuthGuard: React.FC<SimpleAuthGuardProps> = ({ children }) => {
  const { user, loading } = useSimpleAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/simple-login" replace />;
  }

  return <>{children}</>;
};
