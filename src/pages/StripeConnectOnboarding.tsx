import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CreditCard, 
  Building, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { 
  createConnectedAccount, 
  getConnectedAccount,
  createAccountLink,
  type ConnectedAccountInfo,
  type StoreAccountInfo
} from '../services/stripeConnectService';

export const StripeConnectOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store_id');

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [hasAccount, setHasAccount] = useState(false);
  const [accountInfo, setAccountInfo] = useState<ConnectedAccountInfo | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreAccountInfo | null>(null);

  // フォームデータ
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<'individual' | 'company'>('individual');

  // 初期チェック
  useEffect(() => {
    if (storeId) {
      checkExistingAccount();
    } else {
      setError('店舗IDが指定されていません');
      setChecking(false);
    }
  }, [storeId]);

  // 既存アカウントをチェック
  const checkExistingAccount = async () => {
    if (!storeId) return;

    setChecking(true);
    setError('');

    try {
      const result = await getConnectedAccount(storeId);

      if (result.success) {
        setHasAccount(result.hasAccount);
        setAccountInfo(result.account || null);
        setStoreInfo(result.store || null);

        if (result.store?.name) {
          setBusinessName(result.store.name);
        }
      } else {
        setError(result.error || 'アカウント情報の取得に失敗しました');
      }
    } catch (error) {
      console.error('アカウントチェックエラー:', error);
      setError('アカウント情報の取得に失敗しました');
    } finally {
      setChecking(false);
    }
  };

  // Connected Accountを作成
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeId || !email || !businessName) {
      setError('すべての項目を入力してください');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await createConnectedAccount(
        storeId,
        email,
        businessName,
        businessType
      );

      if (result.success && result.onboardingUrl) {
        setSuccess('アカウントを作成しました。オンボーディングページに移動します...');
        
        // オンボーディングページにリダイレクト
        setTimeout(() => {
          window.location.href = result.onboardingUrl!;
        }, 1500);
      } else {
        setError(result.error || 'アカウントの作成に失敗しました');
      }
    } catch (error) {
      console.error('アカウント作成エラー:', error);
      setError('アカウントの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // オンボーディングリンクを再生成
  const handleContinueOnboarding = async () => {
    if (!storeId || !accountInfo?.id) return;

    setLoading(true);
    setError('');

    try {
      const result = await createAccountLink(storeId, accountInfo.id);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || 'オンボーディングリンクの作成に失敗しました');
      }
    } catch (error) {
      console.error('オンボーディングリンク作成エラー:', error);
      setError('オンボーディングリンクの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ローディング中
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">アカウント情報を確認中...</p>
        </div>
      </div>
    );
  }

  // アカウントが既に完了している場合
  if (hasAccount && accountInfo?.details_submitted && accountInfo?.charges_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Stripe Connect設定完了
            </h1>
            <p className="text-gray-600">
              決済を受け付ける準備が整いました
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="font-bold text-green-900 mb-4">アカウント情報</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">アカウントID:</span>
                <span className="font-mono text-green-900">{accountInfo.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">決済受付:</span>
                <span className="font-medium text-green-900">
                  {accountInfo.charges_enabled ? '有効' : '無効'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">入金:</span>
                <span className="font-medium text-green-900">
                  {accountInfo.payouts_enabled ? '有効' : '無効'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/menu')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  // アカウントが存在するが未完了の場合
  if (hasAccount && accountInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              オンボーディング未完了
            </h1>
            <p className="text-gray-600">
              Stripe Connectの設定を完了してください
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="font-bold text-yellow-900 mb-4">現在の状態</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-700">詳細情報:</span>
                <span className="font-medium text-yellow-900">
                  {accountInfo.details_submitted ? '提出済み' : '未提出'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">決済受付:</span>
                <span className="font-medium text-yellow-900">
                  {accountInfo.charges_enabled ? '有効' : '無効'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">入金:</span>
                <span className="font-medium text-yellow-900">
                  {accountInfo.payouts_enabled ? '有効' : '無効'}
                </span>
              </div>
            </div>

            {accountInfo.requirements?.currently_due && accountInfo.requirements.currently_due.length > 0 && (
              <div className="mt-4 pt-4 border-t border-yellow-200">
                <p className="text-sm text-yellow-700 mb-2">必要な情報:</p>
                <ul className="list-disc list-inside text-sm text-yellow-900 space-y-1">
                  {accountInfo.requirements.currently_due.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleContinueOnboarding}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  処理中...
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5 mr-2" />
                  オンボーディングを続ける
                </>
              )}
            </button>

            <button
              onClick={checkExistingAccount}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              状態を更新
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 新規アカウント作成フォーム
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Stripe Connect設定
          </h1>
          <p className="text-gray-600">
            決済を受け付けるためにStripe Connectアカウントを作成します
          </p>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-6">
          {/* 店舗情報 */}
          {storeInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="font-medium text-blue-900">{storeInfo.name}</p>
                  <p className="text-sm text-blue-700">店舗ID: {storeInfo.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="store@example.com"
            />
          </div>

          {/* 事業者名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              事業者名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="花屋 ブルーム"
            />
          </div>

          {/* 事業形態 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              事業形態 <span className="text-red-500">*</span>
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as 'individual' | 'company')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="individual">個人事業主</option>
              <option value="company">法人</option>
            </select>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* 成功メッセージ */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                作成中...
              </>
            ) : (
              <>
                アカウントを作成
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </button>
        </form>

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>注意:</strong> アカウント作成後、Stripeのオンボーディングページで追加情報（銀行口座、本人確認書類など）の入力が必要です。
          </p>
        </div>
      </div>
    </div>
  );
};

export default StripeConnectOnboarding;

