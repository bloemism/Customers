import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, CheckCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';

/**
 * アカウントリンク作成ページ
 * 連結アカウントのオンボーディングリンクを簡単に作成できます
 */
export const CreateAccountLink: React.FC = () => {
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState('acct_1SmtPlHk8MTQ5wk4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // API Base URL
  let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  if (!API_BASE_URL) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      API_BASE_URL = 'http://localhost:3000';
    } else {
      API_BASE_URL = 'https://customers-three-rust.vercel.app';
    }
  }

  const handleCreateLink = async () => {
    if (!accountId || !accountId.startsWith('acct_')) {
      setError('有効な連結アカウントIDを入力してください（acct_で始まる必要があります）');
      return;
    }

    setLoading(true);
    setError('');
    setOnboardingUrl('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-account-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: accountId,
          storeId: 'temp-store-id', // 一時的な店舗ID（実際の店舗IDがない場合）
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アカウントリンクの作成に失敗しました');
      }

      const data = await response.json();
      if (data.success && data.url) {
        setOnboardingUrl(data.url);
      } else {
        throw new Error('アカウントリンクURLが取得できませんでした');
      }
    } catch (error) {
      console.error('アカウントリンク作成エラー:', error);
      setError(error instanceof Error ? error.message : 'アカウントリンクの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = () => {
    if (onboardingUrl) {
      window.open(onboardingUrl, '_blank');
    }
  };

  const handleCheckStatus = async () => {
    if (!accountId || !accountId.startsWith('acct_')) {
      setError('有効な連結アカウントIDを入力してください（acct_で始まる必要があります）');
      return;
    }

    setCheckingStatus(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/get-connected-account-status?accountId=${encodeURIComponent(accountId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アカウント状態の確認に失敗しました');
      }

      const data = await response.json();
      if (data.success) {
        setAccountStatus(data.account);
        if (data.onboardingUrl) {
          setOnboardingUrl(data.onboardingUrl);
        }
      } else {
        throw new Error('アカウント状態の取得に失敗しました');
      }
    } catch (error) {
      console.error('アカウント状態確認エラー:', error);
      setError(error instanceof Error ? error.message : 'アカウント状態の確認に失敗しました');
    } finally {
      setCheckingStatus(false);
    }
  };

  // 初回読み込み時に状態を確認
  useEffect(() => {
    if (accountId && accountId.startsWith('acct_')) {
      handleCheckStatus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Stripe Connect オンボーディングリンク作成
        </h1>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              連結アカウントID
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="acct_1SmtPlHk8MTQ5wk4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Stripe DashboardのConnect &gt; Accountsから取得できます
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCheckStatus}
              disabled={checkingStatus || !accountId}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {checkingStatus ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  確認中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  状態を確認
                </>
              )}
            </button>
            <button
              onClick={handleCreateLink}
              disabled={loading || !accountId}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  作成中...
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5 mr-2" />
                  リンクを作成
                </>
              )}
            </button>
          </div>
        </div>

        {/* アカウント状態表示 */}
        {accountStatus && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">アカウント状態</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">決済有効:</span>
                <span className={accountStatus.charges_enabled ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {accountStatus.charges_enabled ? '✓ 有効' : '✗ 無効'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">詳細提出:</span>
                <span className={accountStatus.details_submitted ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {accountStatus.details_submitted ? '✓ 完了' : '✗ 未完了'}
                </span>
              </div>
              {accountStatus.requirements && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs font-medium text-blue-900 mb-2">必要なアクション:</p>
                  {accountStatus.requirements.currently_due && accountStatus.requirements.currently_due.length > 0 ? (
                    <ul className="space-y-1">
                      {accountStatus.requirements.currently_due.map((req: string, index: number) => (
                        <li key={index} className="flex items-start text-xs text-gray-700">
                          <FileText className="h-3 w-3 mr-1 mt-0.5 text-orange-600" />
                          <span>{req.replace(/_/g, ' ').replace(/\./g, ' > ')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-green-600">✓ すべての要件が満たされています</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">エラー</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {onboardingUrl && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start mb-3">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">オンボーディングリンクが作成されました</p>
                <p className="text-sm text-green-600 mt-1">
                  このリンクをクリックして、規約への同意とオンボーディングを完了してください
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenLink}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              オンボーディングページを開く
            </button>
            <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">リンクURL:</p>
              <p className="text-xs text-gray-800 break-all">{onboardingUrl}</p>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">オンボーディング手順</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>上記の連結アカウントIDを入力</li>
            <li>「オンボーディングリンクを作成」ボタンをクリック</li>
            <li>作成されたリンクをクリックしてStripeのオンボーディングページを開く</li>
            <li>規約に同意し、必要な情報を入力（ビジネス情報、銀行口座情報など）</li>
            <li>オンボーディング完了後、制限が解除されます</li>
          </ol>
        </div>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={() => navigate('/stripe-connect-payment')}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            決済ページに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountLink;

