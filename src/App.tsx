import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SimpleAuthProvider } from './contexts/SimpleAuthContext';
import { SimpleAuthGuard } from './components/SimpleAuthGuard';
import { MenuScreen } from './pages/MenuScreen';
import { SimpleMenuScreen } from './pages/SimpleMenuScreen';
import CheckoutScreen from './pages/CheckoutScreen';
import { CustomerManagement } from './pages/CustomerManagement';
import { CustomerRegistration } from './pages/CustomerRegistration';
import { FloristMap } from './pages/FloristMap';
import { StoreRegistration } from './pages/StoreRegistration';
import { StoreOwnerRegistration } from './pages/StoreOwnerRegistration';
import ProductManagement from './pages/ProductManagement';
import { AuthCallback } from './pages/auth/callback';
import { SupabaseTest } from './components/SupabaseTest';
import { LoginForm } from './components/auth/LoginForm';
import { SimpleLoginForm } from './components/auth/SimpleLoginForm';
import { TestRouting } from './pages/TestRouting';
import FlowerLessonMap from './pages/FlowerLessonMap';
import LessonSchoolManagement from './pages/LessonSchoolManagement';
import LessonScheduleManagement from './pages/LessonScheduleManagement';
import PopularityRankings from './pages/PopularityRankings';
import './index.css';

// ローディングスピナーコンポーネント
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
  </div>
);

function App() {
  return (
    <SimpleAuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/simple-menu" replace />} />
            <Route path="/simple-login" element={<SimpleLoginForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/customer-registration" element={<CustomerRegistration />} />
            <Route path="/florist-map" element={
              <SimpleAuthGuard>
                <FloristMap />
              </SimpleAuthGuard>
            } />
            <Route path="/store-registration" element={
              <SimpleAuthGuard>
                <StoreRegistration />
              </SimpleAuthGuard>
            } />
            <Route path="/store-owner-registration" element={<StoreOwnerRegistration />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/test" element={<SupabaseTest />} />
            <Route path="/test-routing" element={<TestRouting />} />
            <Route path="/menu" element={
              <SimpleAuthGuard>
                <MenuScreen />
              </SimpleAuthGuard>
            } />
            <Route path="/simple-menu" element={
              <SimpleAuthGuard>
                <SimpleMenuScreen />
              </SimpleAuthGuard>
            } />
            <Route path="/checkout" element={
              <SimpleAuthGuard>
                <CheckoutScreen />
              </SimpleAuthGuard>
            } />
            <Route path="/customer-management" element={
              <SimpleAuthGuard>
                <CustomerManagement />
              </SimpleAuthGuard>
            } />
            <Route path="/store-management" element={
              <SimpleAuthGuard>
                <StoreRegistration />
              </SimpleAuthGuard>
            } />
            <Route path="/product-management" element={
              <SimpleAuthGuard>
                <ProductManagement />
              </SimpleAuthGuard>
            } />
            <Route path="/flower-lesson-map" element={
              <SimpleAuthGuard>
                <FlowerLessonMap />
              </SimpleAuthGuard>
            } />
            <Route path="/lesson-school-management" element={
              <SimpleAuthGuard>
                <LessonSchoolManagement />
              </SimpleAuthGuard>
            } />
                    <Route path="/lesson-schedule-management" element={
          <SimpleAuthGuard>
            <LessonScheduleManagement />
          </SimpleAuthGuard>
        } />
        <Route path="/popularity-rankings" element={
          <SimpleAuthGuard>
            <PopularityRankings />
          </SimpleAuthGuard>
        } />
        <Route path="*" element={<Navigate to="/simple-menu" replace />} />
          </Routes>
        </div>
      </Router>
    </SimpleAuthProvider>
  );
}

export default App;
