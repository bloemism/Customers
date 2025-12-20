import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SimpleAuthProvider } from './contexts/SimpleAuthContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';
import { SimpleAuthGuard } from './components/SimpleAuthGuard';
import { CustomerAuthGuard } from './components/CustomerAuthGuard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ScrollToTop } from './components/ScrollToTop';
import './App.css';

// コード分割: ページコンポーネントを遅延読み込み
const SimpleMenuScreen = React.lazy(() => import('./pages/SimpleMenuScreen').then(module => ({ default: module.SimpleMenuScreen })));
const CheckoutScreen = React.lazy(() => import('./pages/CheckoutScreen'));
const ProductManagement = React.lazy(() => import('./pages/ProductManagement'));
const CustomerManagement = React.lazy(() => import('./pages/CustomerManagement').then(module => ({ default: module.CustomerManagement })));
const StoreRegistration = React.lazy(() => import('./pages/StoreRegistration').then(module => ({ default: module.StoreRegistration })));
const FloristMap = React.lazy(() => import('./pages/FloristMap').then(module => ({ default: module.FloristMap })));
const FlowerLessonMap = React.lazy(() => import('./pages/FlowerLessonMap'));
const LessonSchoolManagement = React.lazy(() => import('./pages/LessonSchoolManagement'));
const LessonScheduleManagement = React.lazy(() => import('./pages/LessonScheduleManagement'));
// const PopularityRankings = React.lazy(() => import('./pages/PopularityRankings'));
const PublicRankings = React.lazy(() => import('./pages/PublicRankings'));
const StoreAnalytics = React.lazy(() => import('./pages/StoreAnalytics'));
const SubscriptionManagement = React.lazy(() => import('./pages/SubscriptionManagement'));
const ReadmePage = React.lazy(() => import('./pages/ReadmePage').then(module => ({ default: module.ReadmePage })));
const PrivacyAndPaymentPage = React.lazy(() => import('./pages/PrivacyAndPaymentPage').then(module => ({ default: module.PrivacyAndPaymentPage })));
const StripeTest = React.lazy(() => import('./pages/StripeTest'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const CashPaymentPage = React.lazy(() => import('./pages/CashPaymentPage'));
const CustomerMenuScreen = React.lazy(() => import('./pages/CustomerMenuScreen').then(module => ({ default: module.CustomerMenuScreen })));
const CustomerLogin = React.lazy(() => import('./pages/CustomerLogin').then(module => ({ default: module.CustomerLogin })));
const CustomerSignUp = React.lazy(() => import('./pages/CustomerSignUp').then(module => ({ default: module.CustomerSignUp })));
const CustomerDataRegistration = React.lazy(() => import('./pages/CustomerDataRegistration'));
const CustomerQRCode = React.lazy(() => import('./pages/CustomerQRCode'));
const CustomerReadmePage = React.lazy(() => import('./pages/CustomerReadmePage').then(module => ({ default: module.CustomerReadmePage })));
const CustomerCodePage = React.lazy(() => import('./pages/CustomerCodePage'));
const CustomerProfilePage = React.lazy(() => import('./pages/CustomerProfilePage'));
const PaymentHistoryPage = React.lazy(() => import('./pages/PaymentHistoryPage'));
const PointHistoryPage = React.lazy(() => import('./pages/PointHistoryPage'));
const CustomerLessonSchedulePage = React.lazy(() => import('./pages/CustomerLessonSchedulePage'));


// 認証ページ
const SimpleLoginForm = React.lazy(() => import('./components/auth/SimpleLoginForm').then(module => ({ default: module.SimpleLoginForm })));
const SimpleSignUpForm = React.lazy(() => import('./components/auth/SimpleSignUpForm').then(module => ({ default: module.SimpleSignUpForm })));
const SignUpForm = React.lazy(() => import('./components/auth/SignUpForm').then(module => ({ default: module.SignUpForm })));

// その他のページ
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Menu = React.lazy(() => import('./pages/Menu').then(module => ({ default: module.Menu })));
const MenuPage = React.lazy(() => import('./pages/MenuPage').then(module => ({ default: module.default })));
const MenuScreen = React.lazy(() => import('./pages/MenuScreen').then(module => ({ default: module.MenuScreen })));
const StoreOwnerRegistration = React.lazy(() => import('./pages/StoreOwnerRegistration').then(module => ({ default: module.StoreOwnerRegistration })));
const CustomerRegistration = React.lazy(() => import('./pages/CustomerRegistration').then(module => ({ default: module.CustomerRegistration })));
const TestRouting = React.lazy(() => import('./pages/TestRouting').then(module => ({ default: module.TestRouting })));
const SupabaseTest = React.lazy(() => import('./components/SupabaseTest').then(module => ({ default: module.SupabaseTest })));

// ローディングコンポーネント
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600">読み込み中...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
    <SimpleAuthProvider>
    <CustomerAuthProvider>
        <div className="App">
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
          <Routes>
              {/* 公開ルート */}
              <Route path="/" element={<Home />} />
                          <Route path="/simple-login" element={<SimpleLoginForm />} />
              <Route path="/simple-signup" element={<SimpleSignUpForm />} />
              <Route path="/signup" element={<SignUpForm />} />
              <Route path="/customer-login" element={<CustomerLogin />} />
              <Route path="/customer-signup" element={<CustomerSignUp />} />
              <Route path="/test" element={<TestRouting />} />
              <Route path="/supabase-test" element={<SupabaseTest />} />
              <Route path="/stripe-test" element={<StripeTest />} />
              
              {/* 保護されたルート */}
            <Route path="/menu" element={
              <SimpleAuthGuard>
                  <SimpleMenuScreen />
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
              <Route path="/product-management" element={
                <SimpleAuthGuard>
                  <ProductManagement />
                </SimpleAuthGuard>
              } />
            <Route path="/customer-management" element={
              <SimpleAuthGuard>
                <CustomerManagement />
              </SimpleAuthGuard>
            } />
              <Route path="/store-registration" element={
              <SimpleAuthGuard>
                <StoreRegistration />
              </SimpleAuthGuard>
            } />
              <Route path="/florist-map" element={
                <SimpleAuthGuard>
                  <FloristMap />
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
                  <PublicRankings />
                </SimpleAuthGuard>
              } />
              <Route path="/store-analytics" element={
                <SimpleAuthGuard>
                  <StoreAnalytics />
                </SimpleAuthGuard>
              } />
              <Route path="/subscription-management" element={
                <SimpleAuthGuard>
                  <SubscriptionManagement />
                </SimpleAuthGuard>
              } />
              <Route path="/privacy-and-payment" element={
                <SimpleAuthGuard>
                  <PrivacyAndPaymentPage />
                </SimpleAuthGuard>
              } />
              <Route path="/policy" element={
                <SimpleAuthGuard>
                  <PrivacyAndPaymentPage />
                </SimpleAuthGuard>
              } />
              <Route path="/readme" element={<ReadmePage />} />
              <Route path="/customer-menu" element={
              <CustomerAuthGuard>
                  <CustomerMenuScreen />
                </CustomerAuthGuard>
              } />
              <Route path="/customer-profile" element={
              <CustomerAuthGuard>
                <CustomerProvider>
                  <CustomerProfilePage />
                </CustomerProvider>
                </CustomerAuthGuard>
              } />
              <Route path="/customer-data-registration" element={
              <CustomerAuthGuard>
                  <CustomerDataRegistration />
                </CustomerAuthGuard>
              } />
              <Route path="/customer-qr" element={
              <CustomerAuthGuard>
                  <CustomerQRCode />
                </CustomerAuthGuard>
              } />
              <Route path="/customer-readme" element={
              <CustomerAuthGuard>
                  <CustomerReadmePage />
                </CustomerAuthGuard>
              } />
              <Route path="/customer-code" element={
              <CustomerAuthGuard>
                  <CustomerCodePage />
                </CustomerAuthGuard>
              } />
              <Route path="/customer-payments" element={
              <CustomerAuthGuard>
                <CustomerProvider>
                  <PaymentHistoryPage />
                </CustomerProvider>
                </CustomerAuthGuard>
              } />
              <Route path="/customer-points" element={
              <CustomerAuthGuard>
                <CustomerProvider>
                  <PointHistoryPage />
                </CustomerProvider>
                </CustomerAuthGuard>
              } />
              <Route path="/customer-lesson-schedules" element={
              <CustomerAuthGuard>
                <CustomerProvider>
                  <CustomerLessonSchedulePage />
                </CustomerProvider>
                </CustomerAuthGuard>
              } />
              <Route path="/store-payment" element={
                <SimpleAuthGuard>
                  <CustomerProvider>
                    <PaymentPage />
                  </CustomerProvider>
                </SimpleAuthGuard>
              } />
              <Route path="/dynamic-stripe-checkout" element={
                <SimpleAuthGuard>
                  <CustomerProvider>
                    <PaymentPage />
                  </CustomerProvider>
                </SimpleAuthGuard>
              } />
              <Route path="/cash-payment" element={
                <SimpleAuthGuard>
                  <CustomerProvider>
                    <CashPaymentPage />
                  </CustomerProvider>
                </SimpleAuthGuard>
              } />

              
              {/* レガシールート */}
              <Route path="/old-menu" element={
                <SimpleAuthGuard>
                  <Menu />
                </SimpleAuthGuard>
              } />
              <Route path="/menu-screen" element={
                <SimpleAuthGuard>
                  <MenuScreen />
                </SimpleAuthGuard>
              } />
              <Route path="/store-owner-registration" element={
                <SimpleAuthGuard>
                  <StoreOwnerRegistration />
                </SimpleAuthGuard>
              } />
              <Route path="/customer-registration" element={
              <SimpleAuthGuard>
                  <CustomerRegistration />
              </SimpleAuthGuard>
            } />
              
              {/* デフォルトルート */}
              <Route path="*" element={<Home />} />
          </Routes>
          </Suspense>
        </div>
      </CustomerAuthProvider>
      </SimpleAuthProvider>
      </Router>
  );
}

export default App;
