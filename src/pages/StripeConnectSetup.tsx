import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { StripeConnectService, type ConnectedAccount } from '../services/stripeConnectService';
import { 
  CreditCard, 
  Building, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  ArrowLeft,
  Banknote,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StoreData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  stripe_account_id?: string;
  stripe_account_status?: string;
  stripe_account_verified?: boolean;
  stripe_connect_enabled?: boolean;
}

export const StripeConnectSetup: React.FC = () => {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [connectAccount, setConnectAccount] = useState<ConnectedAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'info' | 'setup' | 'verification' | 'complete'>('info');

  // フォームデータ
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual' as 'individual' | 'company',
    country: 'JP',
    currency: 'jpy',
    phone: '',
    address: ''
  });

  // 店舗データの取得
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('店舗データ取得エラー:', error);
          setError('店舗データの取得に失敗しました');
          return;
        }

        if (data) {
          setStoreData(data);
          setFormData(prev => ({
            ...prev,
            businessName: data.name || '',
            phone: data.phone || '',
            address: data.address || ''
          }));

          // Stripe Connect状況を確認
          if (data.stripe_account_id) {
            await checkConnectStatus(data.id);
          }
        }
      } catch (error) {
        console.error('店舗データ取得エラー:', error);
        setError('店舗データの取得に失敗しました');
      }
    };

    fetchStoreData();
  }, [user]);

  // Stripe Connect状況確認
  const checkConnectStatus = async (storeId: string) => {
    try {
      const { data, error } = await StripeConnectService.checkConnectStatus(storeId);
      
      if (error) {
        console.error('Connect状況確認エラー:', error);
        return;
      }

      if (data) {
        setStoreData(prev => prev ? { ...prev, ...data } : null);
        
        // ステップを決定
        if (data.stripe_connect_enabled && data.stripe_account_verified) {
          setStep('complete');
        } else if (data.stripe_account_id) {
          setStep('verification');
        } else {
          setStep('setup');
        }
      }
    } catch (error) {
      console.error('Connect状況確認エラー:', error);
    }
  };

  // Connected Account作成
  const createConnectedAccount = async () => {
    if (!storeData) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await StripeConnectService.createConnectedAccount({
        email: storeData.email,
        businessName: formData.businessName,
        businessType: formData.businessType,
        country: formData.country,
        currency: formData.currency,
        phone: formData.phone,
        address: formData.address
      });

      if (error) {
        setError(error);
        return;
      }

      if (data) {
        setConnectAccount(data);
        
        // データベースを更新
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            stripe_account_id: data.id,
            stripe_account_status: data.status,
            stripe_connect_enabled: true
          })
          .eq('id', storeData.id);

        if (updateError) {
          console.error('データベース更新エラー:', updateError);
        }

        setSuccess('Stripe Connect アカウントが作成されました');
        setStep('verification');
      }
    } catch (error) {
      console.error('Connected Account作成エラー:', error);
      setError('アカウント作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 手数料計算の表示
  const [fees, setFees] = useState<any>(null);
  
  const calculateFees = async (amount: number) => {
    try {
      const { data, error } = await StripeConnectService.calculateFees(amount);
      if (data) {
        setFees(data);
      }
    } catch (error) {
      console.error('手数料計算エラー:', error);
    }
  };

  useEffect(() => {
    calculateFees(1000); // 1000円の例
  }, []);

  if (!storeData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">店舗データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/menu')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-4"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Stripe Connect 設定</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                step === 'complete' ? 'bg-green-500' : 
                step === 'verification' ? 'bg-yellow-500' : 
                'bg-gray-300'
              }`}></div>
              <span className="text-sm text-gray-600">
                {step === 'complete' ? '完了' : 
                 step === 'verification' ? '審査中' : 
                 '設定中'}
              </span>
            </div>
          </div>
        </div>

        {/* 店舗情報表示 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Building className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">店舗情報</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-600">店舗名:</span>
              <span className="ml-2 font-medium">{storeData.name}</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-600">メール:</span>
              <span className="ml-2 font-medium">{storeData.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-600">電話:</span>
              <span className="ml-2 font-medium">{storeData.phone}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-600">住所:</span>
              <span className="ml-2 font-medium">{storeData.address}</span>
            </div>
          </div>
        </div>

        {/* 手数料情報 */}
        {fees && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <Banknote className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">手数料情報</h2>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-green-600">総額</p>
                  <p className="text-lg font-bold text-green-800">¥{fees.totalAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">プラットフォーム手数料</p>
                  <p className="text-lg font-bold text-blue-800">¥{fees.platformFee}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600">Stripe手数料</p>
                  <p className="text-lg font-bold text-purple-800">¥{fees.stripeFee}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-600">店舗受取額</p>
                  <p className="text-lg font-bold text-orange-800">¥{fees.storeAmount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 設定フォーム */}
        {step === 'setup' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <Settings className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Stripe Connect 設定</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業名
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="事業名を入力してください"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業形態
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value as 'individual' | 'company' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="individual">個人事業主</option>
                  <option value="company">法人</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="電話番号を入力してください"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="住所を入力してください"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={createConnectedAccount}
                disabled={loading || !formData.businessName}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin inline mr-2" />
                    アカウント作成中...
                  </>
                ) : (
                  'Stripe Connect アカウントを作成'
                )}
              </button>
            </div>
          </div>
        )}

        {/* 審査状況 */}
        {step === 'verification' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">審査状況</h2>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 mb-2">
                Stripe Connect アカウントが作成されました。
              </p>
              <p className="text-yellow-700 text-sm">
                本人確認と審査が完了するまで、決済機能は利用できません。
                通常1-3営業日で完了します。
              </p>
            </div>
          </div>
        )}

        {/* 完了状況 */}
        {step === 'complete' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">設定完了</h2>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 mb-2">
                Stripe Connect の設定が完了しました！
              </p>
              <p className="text-green-700 text-sm">
                これで顧客からの決済を受け付けることができます。
                手数料は自動的に分割され、店舗の口座に振り込まれます。
              </p>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
