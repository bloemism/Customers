import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCustomer } from '../contexts/CustomerContext';
import { ArrowLeft, CreditCard, DollarSign, QrCode, CheckCircle, AlertCircle } from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customer } = useCustomer();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'qr'>('qr');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('有効な金額を入力してください');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // 決済処理のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/payment-complete');
      }, 2000);
    } catch (err) {
      setError('決済処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center items-center px-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">決済完了！</h2>
          <p className="text-gray-600 mb-6">
            決済が正常に完了しました。<br />
            完了ページに移動します...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </button>
            <h1 className="text-xl font-bold text-gray-900">決済</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顧客情報 */}
        {customer && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">顧客情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">名前</p>
                <p className="font-medium text-gray-900">{customer.name || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">現在のポイント</p>
                <p className="font-medium text-green-600">{customer.points} pt</p>
              </div>
            </div>
          </div>
        )}

        {/* 決済方法選択 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">決済方法を選択</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* QRコード決済 */}
            <button
              onClick={() => setPaymentMethod('qr')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                paymentMethod === 'qr'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <QrCode className={`h-12 w-12 mx-auto mb-3 ${
                  paymentMethod === 'qr' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-gray-900 mb-2">QRコード決済</h3>
                <p className="text-sm text-gray-600">店舗でQRコードを読み取り</p>
              </div>
            </button>

            {/* 現金決済 */}
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                paymentMethod === 'cash'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <DollarSign className={`h-12 w-12 mx-auto mb-3 ${
                  paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-gray-900 mb-2">現金決済</h3>
                <p className="text-sm text-gray-600">現金でお支払い</p>
              </div>
            </button>

            {/* クレジット決済 */}
            <button
              onClick={() => setPaymentMethod('credit')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                paymentMethod === 'credit'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <CreditCard className={`h-12 w-12 mx-auto mb-3 ${
                  paymentMethod === 'credit' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-gray-900 mb-2">クレジット決済</h3>
                <p className="text-sm text-gray-600">カードでお支払い</p>
              </div>
            </button>
          </div>
        </div>

        {/* 決済詳細 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">決済詳細</h2>
          
          <div className="space-y-6">
            {/* 金額入力 */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                決済金額 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-lg">¥</span>
                </div>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-8 pr-3 py-4 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg transition-all duration-200"
                  placeholder="1000"
                />
              </div>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* 決済ボタン */}
            <button
              onClick={handlePayment}
              disabled={isProcessing || !amount}
              className="w-full flex justify-center py-4 px-6 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  決済処理中...
                </div>
              ) : (
                `¥${amount || '0'} を決済する`
              )}
            </button>
          </div>
        </div>

        {/* 使用方法 */}
        <div className="bg-blue-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">使用方法</h3>
          <div className="space-y-3 text-blue-800">
            {paymentMethod === 'qr' && (
              <>
                <p>1. 店舗でQRコードを店員に見せてください</p>
                <p>2. 店員がQRコードを読み取ります</p>
                <p>3. 決済金額を入力してください</p>
                <p>4. 決済ボタンを押して完了です</p>
              </>
            )}
            {paymentMethod === 'cash' && (
              <>
                <p>1. 決済金額を入力してください</p>
                <p>2. 現金でお支払いください</p>
                <p>3. 決済ボタンを押して記録を完了</p>
              </>
            )}
            {paymentMethod === 'credit' && (
              <>
                <p>1. 決済金額を入力してください</p>
                <p>2. クレジットカードでお支払いください</p>
                <p>3. 決済ボタンを押して記録を完了</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
