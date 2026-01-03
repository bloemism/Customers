import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { CreditCard, Banknote, Check, AlertCircle, User, Loader, ArrowLeft } from 'lucide-react';
import { getStripe, createPaymentIntent } from '../services/stripeService';
import { useNavigate } from 'react-router-dom';

interface CustomerData {
  id: string;
  email: string;
  name: string;
  points: number;
  level: 'BASIC' | 'REGULAR' | 'PRO' | 'EXPERT';
  phone?: string;
}

interface StoreData {
  storeId: string;
  storeName: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  pointsUsed: number;
  totalAmount: number;
  timestamp: string;
}

interface PaymentData {
  paymentMethod: 'cash' | 'credit';
  customerId: string;
  storeData?: StoreData;
  finalAmount: number;
}

export const StorePayment: React.FC = () => {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentMethod: 'credit',
    customerId: '',
    finalAmount: 0
  });
  const [loading, setLoading] = useState(false);
  
  // 決済コード入力用の状態
  const [paymentCode, setPaymentCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'input' | 'payment' | 'complete'>('input');

  // 顧客データの取得
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('顧客データ取得エラー:', error);
          return;
        }

        if (data) {
          setCustomerData({
            id: data.id,
            email: data.email,
            name: data.name || '',
            points: data.points || 0,
            level: data.level || 'BASIC',
            phone: data.phone
          });
        }
      } catch (error) {
        console.error('顧客データ取得エラー:', error);
      }
    };

    fetchCustomerData();
  }, [user]);

  // 決済コードからデータを取得する関数
  const fetchPaymentByCode = async (code: string) => {
    if (!code || code.length !== 5) {
      setCodeError('5桁の数字を入力してください');
      return;
    }

    try {
      setCodeLoading(true);
      setCodeError('');
      console.log('決済コード取得開始:', code);

      const { data, error } = await supabase
        .from('payment_codes')
        .select('payment_data, expires_at, used_at')
        .eq('code', code)
        .maybeSingle(); // single()の代わりにmaybeSingle()を使用（406エラーを回避）

      if (error) {
        console.error('決済コード取得エラー:', error);
        if (error.code === 'PGRST116') {
          setCodeError('決済コードが見つかりません');
        } else if (error.code === '406' || error.status === 406) {
          setCodeError('アクセス権限がありません。管理者にお問い合わせください。');
        } else if (error.code === 'PGRST301' || error.status === 403) {
          setCodeError('アクセス権限がありません。ログイン状態を確認してください。');
        } else {
          setCodeError(`決済コードの取得に失敗しました: ${error.message || '不明なエラー'}`);
        }
        return;
      }

      if (!data) {
        setCodeError('決済コードが見つかりません');
        return;
      }

      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (now > expiresAt) {
        setCodeError('決済コードの有効期限が切れています');
        return;
      }

      if (data.used_at) {
        setCodeError('この決済コードは既に使用されています');
        return;
      }

      const storeData = data.payment_data;
      console.log('取得した決済データ:', storeData);

      setPaymentData({
        paymentMethod: 'credit',
        customerId: customerData?.id || '',
        storeData: {
          storeId: storeData.storeId,
          storeName: storeData.storeName,
          items: storeData.items,
          pointsUsed: storeData.pointsUsed,
          totalAmount: storeData.totalAmount,
          timestamp: storeData.timestamp
        },
        finalAmount: storeData.totalAmount
      });

      setStep('payment');
      console.log('決済データ設定完了');

    } catch (error) {
      console.error('決済コード取得エラー:', error);
      setCodeError('決済コードの取得に失敗しました');
    } finally {
      setCodeLoading(false);
    }
  };

  // 決済処理（Stripe Checkoutページにリダイレクト）
  const handlePayment = async () => {
    if (!paymentData.storeData || !customerData) {
      setError('決済データが不足しています');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 決済データをローカルストレージに保存
      const paymentSessionData = {
        customerData,
        storeData: paymentData.storeData,
        finalAmount: paymentData.finalAmount,
        paymentCode,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('payment_session', JSON.stringify(paymentSessionData));

      // 動的決済ページにリダイレクト（金額が正確に反映される）
      navigate('/dynamic-stripe-checkout');

    } catch (error) {
      console.error('決済エラー:', error);
      setError(error instanceof Error ? error.message : '決済に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/customer-menu')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">店舗決済</h1>
              <div className="w-10"></div>
            </div>
          </div>

          {/* 決済コード入力 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">🔢</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">決済コード入力</h2>
              <p className="text-sm text-gray-600">店舗から伝えられた5桁のコードを入力してください</p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={paymentCode}
                  onChange={(e) => setPaymentCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="12345"
                  className="w-full px-4 py-4 text-center text-3xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={5}
                />
              </div>

              <button
                onClick={() => fetchPaymentByCode(paymentCode)}
                disabled={codeLoading || paymentCode.length !== 5}
                className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
              >
                {codeLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    確認中...
                  </>
                ) : (
                  '決済データを取得'
                )}
              </button>

              {codeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-600 text-sm">{codeError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('input')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">決済確認</h1>
              <div className="w-10"></div>
            </div>
          </div>

          {/* 店舗情報 */}
          {paymentData.storeData && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">店舗情報</h2>
              <div className="space-y-2">
                <p className="text-gray-700"><span className="font-medium">店舗名:</span> {paymentData.storeData.storeName}</p>
                <p className="text-gray-700"><span className="font-medium">決済コード:</span> {paymentCode}</p>
              </div>
            </div>
          )}

          {/* 商品情報 */}
          {paymentData.storeData && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">購入商品</h2>
              <div className="space-y-3">
                {paymentData.storeData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900">¥{item.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 顧客情報 */}
          {customerData && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">お客様情報</h2>
              <div className="space-y-2">
                <p className="text-gray-700"><span className="font-medium">お名前:</span> {customerData.name}</p>
                <p className="text-gray-700"><span className="font-medium">メール:</span> {customerData.email}</p>
                <p className="text-gray-700"><span className="font-medium">ポイント:</span> {customerData.points.toLocaleString()}pt</p>
              </div>
            </div>
          )}

          {/* 決済金額 */}
          {paymentData.storeData && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">決済金額</h2>
              <div className="space-y-2">
                {paymentData.storeData.pointsUsed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">使用ポイント:</span>
                    <span className="text-red-600">-{paymentData.storeData.pointsUsed.toLocaleString()}pt</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gray-900">合計金額:</span>
                  <span className="text-purple-600">¥{(paymentData.finalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* 決済ボタン */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium text-lg"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                決済処理中...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                ¥{(paymentData.finalAmount || 0).toLocaleString()} を決済する
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">決済完了</h1>
            <p className="text-gray-600 mb-6">決済が正常に完了しました</p>
            <button
              onClick={() => navigate('/customer-menu')}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
