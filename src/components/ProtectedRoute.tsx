import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useSimpleAuth();

  console.log('🛡️ ProtectedRoute: 認証状態チェック:', { user, loading });

  if (loading) {
    console.log('⏳ ProtectedRoute: 読み込み中...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証確認中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute: 未認証 - ログインページへリダイレクト');
    return <Navigate to="/simple-login" replace />;
  }

  console.log('✅ ProtectedRoute: 認証済み - コンテンツ表示');
  return <>{children}</>;
};

export default ProtectedRoute;
