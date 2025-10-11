import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

export const StripeConnectRefresh: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store_id');

  useEffect(() => {
    // 2秒後にオンボーディングページにリダイレクト
    const timer = setTimeout(() => {
      if (storeId) {
        navigate(`/stripe-connect-onboarding?store_id=${storeId}`);
      } else {
        navigate('/menu');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [storeId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <RefreshCw className="h-8 w-8 text-white animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          リダイレクト中...
        </h1>
        <p className="text-gray-600">
          オンボーディングページに戻ります
        </p>
      </div>
    </div>
  );
};

export default StripeConnectRefresh;

