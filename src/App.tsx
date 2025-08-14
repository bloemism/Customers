import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MenuScreen } from './pages/MenuScreen';
import { CheckoutScreen } from './pages/CheckoutScreen';
import { CustomerManagement } from './pages/CustomerManagement';
import { CustomerRegistration } from './pages/CustomerRegistration';
import { FloristMap } from './pages/FloristMap';
import { StoreRegistration } from './pages/StoreRegistration';
import { StoreOwnerRegistration } from './pages/StoreOwnerRegistration';
import { AuthCallback } from './pages/auth/callback';
import { SupabaseTest } from './components/SupabaseTest';
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
          <Route path="/customer-registration" element={<CustomerRegistration />} />
          <Route path="/florist-map" element={
            <ProtectedRoute>
              <FloristMap />
            </ProtectedRoute>
          } />
          <Route path="/store-registration" element={
            <ProtectedRoute>
              <StoreRegistration />
            </ProtectedRoute>
          } />
          <Route path="/store-owner-registration" element={<StoreOwnerRegistration />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/test" element={<SupabaseTest />} />
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
          <Route path="/customer-management" element={
            <ProtectedRoute>
              <CustomerManagement />
            </ProtectedRoute>
          } />
          <Route path="/store-management" element={
            <ProtectedRoute>
              <StoreRegistration />
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
