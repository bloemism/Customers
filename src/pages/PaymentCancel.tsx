import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentCode = searchParams.get('payment_code');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            決済がキャンセルされました
          </h1>
          <p className="text-gray-600 mb-6">
            決済は完了していません。再度お試しいただくか、店舗に直接お問い合わせください。
          </p>

          {paymentCode && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">決済コード:</span>
                  <span className="font-medium">{paymentCode}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/customer-menu')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              メニューに戻る
            </button>
            <button
              onClick={() => navigate('/payment')}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              決済を再試行
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;

