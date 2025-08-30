import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { MapProvider } from './contexts/MapContext';
import { SimpleAuthProvider } from './contexts/SimpleAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// 花屋向け店舗管理システムのページコンポーネント
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const SimpleLoginForm = React.lazy(() => import('./components/auth/SimpleLoginForm').then(module => ({ default: module.SimpleLoginForm })));
const SignUpForm = React.lazy(() => import('./components/auth/SignUpForm').then(module => ({ default: module.SignUpForm })));
const SimpleMenuScreen = React.lazy(() => import('./pages/SimpleMenuScreen').then(module => ({ default: module.SimpleMenuScreen })));
const FloristMap = React.lazy(() => import('./pages/FloristMap').then(module => ({ default: module.FloristMap })));
const FlowerLessonMap = React.lazy(() => import('./pages/FlowerLessonMap'));
const CustomerManagement = React.lazy(() => import('./pages/CustomerManagement').then(module => ({ default: module.CustomerManagement })));
const ProductManagement = React.lazy(() => import('./pages/ProductManagement'));
const StoreRegistration = React.lazy(() => import('./pages/StoreRegistration').then(module => ({ default: module.StoreRegistration })));
const CheckoutScreen = React.lazy(() => import('./pages/CheckoutScreen'));
const LessonSchoolManagement = React.lazy(() => import('./pages/LessonSchoolManagement'));
const LessonScheduleManagement = React.lazy(() => import('./pages/LessonScheduleManagement'));
const PopularityRankings = React.lazy(() => import('./pages/PopularityRankings'));
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
                      <Route path="/simple-login" element={<SimpleLoginForm />} />
                      <Route path="/signup" element={<SignUpForm />} />
                      
                      {/* ホームページ */}
                      <Route path="/" element={<Home />} />
                      
                      {/* 保護されたルート - 花屋向け機能 */}
                      <Route path="/menu" element={
                        <ProtectedRoute>
                          <SimpleMenuScreen />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/florist-map" element={
                        <ProtectedRoute>
                          <FloristMap />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/flower-lesson-map" element={
                        <ProtectedRoute>
                          <FlowerLessonMap />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/customer-management" element={
                        <ProtectedRoute>
                          <CustomerManagement />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/product-management" element={
                        <ProtectedRoute>
                          <ProductManagement />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/store-registration" element={
                        <ProtectedRoute>
                          <StoreRegistration />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/checkout" element={
                        <ProtectedRoute>
                          <CheckoutScreen />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/lesson-school-management" element={
                        <ProtectedRoute>
                          <LessonSchoolManagement />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/lesson-schedule-management" element={
                        <ProtectedRoute>
                          <LessonScheduleManagement />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/popularity-rankings" element={
                        <ProtectedRoute>
                          <PopularityRankings />
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
