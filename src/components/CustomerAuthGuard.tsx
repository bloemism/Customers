import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { supabase } from '../lib/supabase';

interface CustomerAuthGuardProps {
  children: React.ReactNode;
}

export const CustomerAuthGuard: React.FC<CustomerAuthGuardProps> = ({ children }) => {
  const { customer, loading } = useCustomerAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        console.log('CustomerAuthGuard - Session check:', currentSession?.user?.id);
        console.log('CustomerAuthGuard - Customer:', customer?.id);
        console.log('CustomerAuthGuard - Loading:', loading);
        
        // セッションがあるか、customerがある場合は認証済みとみなす
        if (currentSession?.user || customer) {
          setIsAuthenticated(true);
          console.log('CustomerAuthGuard - Authenticated');
        } else {
          console.log('CustomerAuthGuard - No session or customer, redirecting to /customer-login');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('認証確認エラー:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [customer, loading]);

  // loadingが完了するまで待つ
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('CustomerAuthGuard - Not authenticated');
    console.log('CustomerAuthGuard - Session:', session?.user?.id);
    console.log('CustomerAuthGuard - Customer:', customer?.id);
    console.log('CustomerAuthGuard - Redirecting to /customer-login');
    return <Navigate to="/customer-login" replace />;
  }

  console.log('CustomerAuthGuard - Rendering children');
  return <>{children}</>;
};