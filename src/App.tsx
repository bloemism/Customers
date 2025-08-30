import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { MapProvider } from './contexts/MapContext';
import { SimpleAuthProvider } from './contexts/SimpleAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// 顧客アプリのページコンポーネント
const SimpleLoginForm = React.lazy(() => import('./components/auth/SimpleLoginForm').then(module => ({ default: module.SimpleLoginForm })));
const SignUpForm = React.lazy(() => import('./components/auth/SignUpForm').then(module => ({ default: module.SignUpForm })));
const MenuPage = React.lazy(() => import('./pages/MenuPage').then(module => ({ default: module.MenuPage })));
const FloristMap = React.lazy(() => import('./pages/FloristMap').then(module => ({ default: module.FloristMap })));
const QRCodePage = React.lazy(() => import('./pages/QRCodePage').then(module => ({ default: module.QRCodePage })));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage').then(module => ({ default: module.PaymentPage })));

// ローディングコンポーネント
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">読み込み中...</p>
    </div>
  </div>
);

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <CustomerProvider>
          <MapProvider>
            <SimpleAuthProvider>
              <Router>
                <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* 認証ページ */}
                      <Route path="/login" element={<SimpleLoginForm />} />
                      <Route path="/signup" element={<SignUpForm />} />
                      
                      {/* 保護されたルート */}
                      <Route path="/" element={
                        <ProtectedRoute>
                          <MenuPage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/florist-map" element={
                        <ProtectedRoute>
                          <FloristMap />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/qr-code" element={
                        <ProtectedRoute>
                          <QRCodePage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/payment" element={
                        <ProtectedRoute>
                          <PaymentPage />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </Suspense>
                </div>
              </Router>
            </SimpleAuthProvider>
          </MapProvider>
        </CustomerProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
