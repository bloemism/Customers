import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle, ArrowLeft, Info } from 'lucide-react';

// API Base URL（ローカル環境ではローカルAPIサーバーを使用）
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
if (!API_BASE_URL) {
  // ローカル環境ではローカルAPIサーバーを使用
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = 'http://localhost:3000';
  } else {
    // 本番環境ではVercelのAPIエンドポイントを使用
    API_BASE_URL = 'https://customers-three-rust.vercel.app';
  }
}

/**
 * Stripe Connect Standard連結アカウント用の決済ページ
 * 
 * このページは単独で動作する決済ページです。
 * 連結アカウントID: acct_1Rp6qzQlIIKeUOm9
 * 
 * 資金と手数料の流れ:
 * 1. 顧客の決済: 購入者がクレジットカード等で決済を行います
 * 2. 売上の計上: その決済は販売側（連結アカウント）のStripeアカウントの売上として計上されます
 * 3. 手数料の差し引き: その売上から、以下の2種類の手数料が自動的に差し引かれます
 *    - Stripe決済手数料: Stripeを利用するための基本手数料（例: 日本国内カードなら3.6%）
 *    - プラットフォーム手数料（Application Fee）: 運営側が設定した独自の仲介手数料
 * 4. 振込: 手数料が引かれた後の残りの金額が、販売側の銀行口座へStripeから直接振り込まれます
 * 
 * 運営側（あなた）の収益:
 * 運営側には、上記ステップ3で差し引かれた「プラットフォーム手数料」のみが、運営側のStripeアカウント残高に積み上がります
 */
export const StripeConnectPayment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Stripe Connect連結アカウントID（固定値）
  // 注意: 実際の連結アカウントIDに変更してください
  const CONNECTED_ACCOUNT_ID = 'acct_1SmtPlHk8MTQ5wk4';
  
  // 状態管理
  const [amount, setAmount] = useState<number>(1000); // デフォルト1000円
  const [productName, setProductName] = useState<string>('花屋でのお買い物');
  const [platformFeeRate, setPlatformFeeRate] = useState<number>(0.03); // 3%のプラットフォーム手数料
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    amount: number;
    platformFee: number;
    stripeFee: number;
    storeAmount: number;
  } | null>(null);

  // URLパラメータから決済情報を取得（オプション）
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlAmount = urlParams.get('amount');
    const urlProductName = urlParams.get('product_name');
    const urlFeeRate = urlParams.get('fee_rate');
    
    if (urlAmount) {
      const parsedAmount = parseFloat(urlAmount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        setAmount(parsedAmount);
      }
    }
    
    if (urlProductName) {
      setProductName(urlProductName);
    }
    
    if (urlFeeRate) {
      const parsedFeeRate = parseFloat(urlFeeRate);
      if (!isNaN(parsedFeeRate) && parsedFeeRate >= 0 && parsedFeeRate <= 1) {
        setPlatformFeeRate(parsedFeeRate);
      }
    }
    
    // キャンセルされた場合
    const canceled = urlParams.get('canceled');
    if (canceled === 'true') {
      setError('決済がキャンセルされました');
    }
  }, [location.search]);

  // 決済完了後の処理
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const session_id = urlParams.get('session_id');
    
    if (session_id) {
      // 決済完了
      setSuccess(true);
    }
  }, [location.search]);

  // 手数料計算
  useEffect(() => {
    if (amount > 0) {
      // 日本円（JPY）は小数点以下の通貨がないため、そのまま使用（* 100しない）
      const amountInSmallestUnit = Math.round(amount);
      const platformFeeInSmallestUnit = Math.round(amountInSmallestUnit * platformFeeRate);
      // Stripe決済手数料（日本国内カード: 3.6% + 40円）
      const stripeFeeRate = 0.036;
      const stripeFeeFixed = 40; // 固定手数料（円単位）
      const stripeFeeInSmallestUnit = Math.round(amountInSmallestUnit * stripeFeeRate) + stripeFeeFixed;
      const storeAmountInSmallestUnit = amountInSmallestUnit - platformFeeInSmallestUnit - stripeFeeInSmallestUnit;
      
      setPaymentInfo({
        amount: amount,
        platformFee: platformFeeInSmallestUnit,
        stripeFee: stripeFeeInSmallestUnit,
        storeAmount: Math.max(0, storeAmountInSmallestUnit), // 負の値にならないように
      });
    }
  }, [amount, platformFeeRate]);

  // Stripe Connect決済処理
  const handlePayment = async () => {
    if (amount <= 0) {
      setError('決済金額は0より大きい値である必要があります');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 日本円（JPY）は小数点以下の通貨がないため、そのまま送信（* 100しない）
      const amountInSmallestUnit = Math.round(amount);
      const applicationFeeAmount = Math.round(amountInSmallestUnit * platformFeeRate);

      console.log('Stripe Connect決済開始:', {
        amount: amountInSmallestUnit,
        connected_account_id: CONNECTED_ACCOUNT_ID,
        application_fee_amount: applicationFeeAmount,
        product_name: productName
      });

      // Stripe Connect決済Intent作成
      const response = await fetch(`${API_BASE_URL}/api/create-connect-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInSmallestUnit, // 日本円（JPY）はそのまま円単位で送信
          currency: 'jpy',
          connected_account_id: CONNECTED_ACCOUNT_ID,
          application_fee_amount: applicationFeeAmount, // プラットフォーム手数料（円単位）
          product_name: productName,
          metadata: {
            payment_type: 'stripe_connect_standard',
            connected_account_id: CONNECTED_ACCOUNT_ID,
            platform_fee_rate: platformFeeRate.toString(),
          }
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : { error: 'Unknown error' };
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('API エラーレスポンス:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData,
          API_BASE_URL
        });
        
        // 404エラーの場合、より詳細なメッセージを表示
        if (response.status === 404) {
          throw new Error(`APIエンドポイントが見つかりません (404)。URL: ${API_BASE_URL}/api/create-connect-payment-intent。ローカル環境ではVercelのAPIエンドポイントを使用してください。`);
        }
        
        // 連結アカウントの状態に関する詳細なエラーメッセージを構築
        let errorMessage = errorData.error || `Payment Intentの作成に失敗しました (${response.status})`;
        
        if (errorData.charges_enabled === false) {
          errorMessage += '\n\n⚠️ 連結アカウントで決済が有効になっていません。';
          
          if (errorData.details_submitted === false) {
            errorMessage += '\nオンボーディングを完了する必要があります。';
          }
          
          if (errorData.requirements && errorData.requirements.currently_due) {
            errorMessage += '\n\n必要な情報:';
            const requirements = errorData.requirements.currently_due;
            requirements.forEach((req: string) => {
              const reqName = req.replace(/_/g, ' ').replace(/\./g, ' > ');
              errorMessage += `\n- ${reqName}`;
            });
          }
          
          errorMessage += '\n\nオンボーディングリンクを作成して、必要な情報を提供してください。';
        }
        
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) {
        console.error('空のレスポンス:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          API_BASE_URL
        });
        throw new Error(`空のレスポンスが返されました (${response.status})。APIエンドポイントが正しく動作していない可能性があります。`);
      }
      const result = JSON.parse(text);
      console.log('Stripe Connect決済Intent作成成功:', result);

      // Checkout SessionのURLを取得
      if (result.url) {
        // Checkout Session URLが直接返された場合
        window.location.href = result.url;
      } else if (result.sessionId) {
        // Session IDのみ返された場合、Stripe Checkout URLを構築
        const checkoutUrl = `https://checkout.stripe.com/c/pay/${result.sessionId}`;
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Checkout URLが取得できませんでした');
      }

    } catch (error) {
      console.error('Stripe Connect決済エラー:', error);
      setError(error instanceof Error ? error.message : '決済に失敗しました');
      setLoading(false);
    }
  };

  // 決済完了画面
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">決済完了</h1>
            <p className="text-gray-600">決済が正常に完了しました</p>
          </div>
          
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 mb-2">
              <strong>決済金額:</strong> ¥{amount.toLocaleString()}
            </p>
            {paymentInfo && (
              <>
                <p className="text-sm text-green-800 mb-2">
                  <strong>プラットフォーム手数料:</strong> ¥{paymentInfo.platformFee.toLocaleString()}
                </p>
                <p className="text-sm text-green-800">
                  <strong>店舗への振込額:</strong> ¥{paymentInfo.storeAmount.toLocaleString()}
                </p>
              </>
            )}
          </div>
          
          <button
            onClick={() => {
              setSuccess(false);
              setAmount(1000);
              setError('');
            }}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            新しい決済を行う
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Stripe Connect決済</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* 決済情報入力 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">決済情報</h2>
          </div>
          
          <div className="space-y-4">
            {/* 決済金額入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                決済金額（円）
              </label>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    setAmount(0);
                    return;
                  }
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value >= 0) {
                    setAmount(value);
                  }
                }}
                min="1"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1000"
              />
            </div>

            {/* 商品名入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品名
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="花屋でのお買い物"
              />
            </div>

            {/* プラットフォーム手数料率入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プラットフォーム手数料率（%）
              </label>
              <input
                type="number"
                value={(platformFeeRate * 100).toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    setPlatformFeeRate(value / 100);
                  }
                }}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="3.00"
              />
            </div>

            {/* 手数料計算結果表示 */}
            {paymentInfo && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-3">
                  <Info className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-blue-900">手数料計算結果</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">決済金額:</span>
                    <span className="font-medium text-gray-900">¥{paymentInfo.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Stripe決済手数料（約3.6% + 40円）:</span>
                    <span className="font-medium text-gray-900">¥{paymentInfo.stripeFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">プラットフォーム手数料（{platformFeeRate * 100}%）:</span>
                    <span className="font-medium text-gray-900">¥{paymentInfo.platformFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-900">店舗への振込額:</span>
                      <span className="font-bold text-blue-900 text-lg">¥{paymentInfo.storeAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">運営側の収益:</span>
                      <span className="font-medium text-green-600">¥{paymentInfo.platformFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 連結アカウント情報 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <p className="mb-1"><strong>連結アカウントID:</strong> {CONNECTED_ACCOUNT_ID}</p>
                <p className="text-xs text-gray-500">
                  この決済はStripe Connect Standard連結アカウント経由で処理されます
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 決済ボタン */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <button
            onClick={handlePayment}
            disabled={loading || amount <= 0}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                処理中...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Stripe Connectで決済する
              </>
            )}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Stripe Connect Standard連結アカウント経由の安全な決済システム
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <div className="text-red-800 mb-2 whitespace-pre-line">{error}</div>
                {(error.includes('決済が有効') || error.includes('制限') || error.includes('規約') || error.includes('オンボーディング') || error.includes('必要な情報')) && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm text-red-700 mb-2">
                      連結アカウントのオンボーディングを完了する必要があります。
                    </p>
                    <a
                      href="/create-account-link"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      オンボーディングリンクを作成する →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 資金と手数料の流れ説明 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <div className="flex items-center mb-4">
            <Info className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">資金と手数料の流れ</h2>
          </div>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">1.</span>
              <span>顧客の決済: 購入者がクレジットカード等で決済を行います</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">2.</span>
              <span>売上の計上: その決済は販売側（連結アカウント）のStripeアカウントの売上として計上されます</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">3.</span>
              <span>手数料の差し引き: その売上から、以下の2種類の手数料が自動的に差し引かれます</span>
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                <span>Stripe決済手数料: Stripeを利用するための基本手数料（例: 日本国内カードなら3.6%）</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                <span>プラットフォーム手数料（Application Fee）: 運営側が設定した独自の仲介手数料</span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">4.</span>
              <span>振込: 手数料が引かれた後の残りの金額が、販売側の銀行口座へStripeから直接振り込まれます</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-start">
                <span className="font-bold text-green-600 mr-2">運営側の収益:</span>
                <span>上記ステップ3で差し引かれた「プラットフォーム手数料」のみが、運営側のStripeアカウント残高に積み上がります</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

