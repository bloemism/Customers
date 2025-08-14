import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MenuScreen } from './pages/MenuScreen';
import { CheckoutScreen } from './pages/CheckoutScreen';
import { LoginForm } from './components/auth/LoginForm';
import './index.css';

// ローディングスピナーコンポーネント
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
  </div>
);

// 認証ガードコンポーネント
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// useAuthフックを使用するためのコンポーネント
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
                  <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/menu" element={
            <ProtectedRoute>
              <MenuScreen />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <CheckoutScreen />
            </ProtectedRoute>
          } />
          <Route path="/florist-map" element={
            <ProtectedRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">全国フローリストマップ</h1>
                <p>GPS位置情報で花屋を検索します。</p>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/customer-management" element={
            <ProtectedRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">顧客管理</h1>
                <p>お客様データ・ポイント・販売履歴を管理します。</p>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/store-management" element={
            <ProtectedRoute>
              <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">店舗データ管理</h1>
                <p>GPS位置・店舗情報のカスタマイズを行います。</p>
              </div>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
