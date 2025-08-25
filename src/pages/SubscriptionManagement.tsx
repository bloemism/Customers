import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, PageLayout, Card } from '../components/common';
import { theme } from '../styles/theme';
import { StripeService } from '../services/stripeService';
import { SUBSCRIPTION_PRODUCTS } from '../lib/stripe';
import type { SubscriptionStatus, PaymentMethod } from '../lib/stripe';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Crown,
  Star,
  Zap,
  ArrowRight,
  RefreshCw,
  Settings,
  Shield
} from 'lucide-react';

export const SubscriptionManagement: React.FC = () => {
  const { user } = useSimpleAuth();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      loadSubscriptionData();
    }
  }, [user]);

  // URLパラメータから成功・キャンセルメッセージを処理
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success === 'true') {
      setSuccessMessage('サブスクリプションが正常に開始されました！');
      // 成功時はデータを再読み込み
      if (user?.email) {
        loadSubscriptionData();
      }
    } else if (canceled === 'true') {
      setError('サブスクリプションの開始がキャンセルされました。');
    }
  }, [searchParams, user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 店舗IDを取得（emailをキーとして使用）
      const storeId = user?.email || '';
      
      const [subscriptionData, paymentMethodsData] = await Promise.all([
        StripeService.getSubscriptionStatus(storeId),
        StripeService.getPaymentMethods(storeId)
      ]);

      setSubscription(subscriptionData);
      setPaymentMethods(paymentMethodsData);
    } catch (err) {
      console.error('サブスクリプションデータ読み込みエラー:', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessing(true);
      setError(null);

      const plan = SUBSCRIPTION_PRODUCTS[planId as keyof typeof SUBSCRIPTION_PRODUCTS];
      if (!plan) {
        throw new Error('プランが見つかりません');
      }

      await StripeService.createSubscription(plan.id, user?.email || '');
    } catch (err) {
      console.error('サブスクリプション作成エラー:', err);
      setError('サブスクリプションの作成に失敗しました');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || !confirm('サブスクリプションをキャンセルしますか？')) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const storeId = user?.email || '';
      await StripeService.cancelSubscription(storeId);
      
      // データを再読み込み
      await loadSubscriptionData();
    } catch (err) {
      console.error('サブスクリプションキャンセルエラー:', err);
      setError('サブスクリプションのキャンセルに失敗しました');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'canceled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'past_due':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'アクティブ';
      case 'canceled':
        return 'キャンセル済み';
      case 'past_due':
        return '支払い遅延';
      case 'unpaid':
        return '未払い';
      default:
        return '不明';
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'price_basic_monthly':
        return <Zap className="h-6 w-6 text-blue-500" />;
      case 'price_premium_monthly':
        return <Star className="h-6 w-6 text-yellow-500" />;
      case 'price_enterprise_monthly':
        return <Crown className="h-6 w-6 text-purple-500" />;
      default:
        return <Shield className="h-6 w-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="サブスクリプション管理"
        subtitle="月額プランの管理と支払い方法の設定"
        icon={<CreditCard className="h-6 w-6" />}
        bgGradient={theme.pageGradients.subscriptionManagement || 'from-blue-500 to-purple-600'}
      />
      
      <PageLayout>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {/* 現在のサブスクリプション状況 */}
        <Card 
          title="現在のサブスクリプション"
          icon={<CreditCard className="h-5 w-5 text-blue-500" />}
          className="mb-8"
        >
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getPlanIcon(subscription.planId)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{subscription.planName}</h3>
                    <p className="text-sm text-gray-600">¥{subscription.planPrice.toLocaleString()}/月</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(subscription.status)}
                  <span className="text-sm font-medium">{getStatusText(subscription.status)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">現在の期間</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString('ja-JP')} 〜 {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
                  </p>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-700">期間終了時にキャンセル</span>
                    </div>
                    <p className="text-sm text-yellow-600">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')} で終了予定
                    </p>
                  </div>
                )}
              </div>

              {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {processing ? '処理中...' : 'サブスクリプションをキャンセル'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">サブスクリプションがありません</h3>
              <p className="text-gray-600 mb-6">プランを選択してサブスクリプションを開始してください</p>
            </div>
          )}
        </Card>

        {/* 利用可能なプラン */}
        <Card 
          title="87app 月額プラン"
          icon={<Settings className="h-5 w-5 text-green-500" />}
          className="mb-8"
        >
          <div className="max-w-2xl mx-auto">
            {Object.entries(SUBSCRIPTION_PRODUCTS).map(([key, plan]) => (
              <div
                key={key}
                className={`p-8 rounded-lg border-2 transition-all ${
                  subscription?.planId === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Crown className="h-8 w-8 text-purple-500" />
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                </div>

                <div className="mb-6 text-center">
                  <span className="text-4xl font-bold text-gray-900">¥{plan.price.toLocaleString()}</span>
                  <span className="text-lg text-gray-600">/月（税込）</span>
                </div>

                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">含まれる機能</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {subscription?.planId === plan.id ? (
                  <div className="text-center py-3 bg-blue-100 text-blue-700 rounded-lg font-medium text-lg">
                    現在のプラン
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(key)}
                    disabled={processing}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 text-lg font-medium"
                  >
                    {processing ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span>プランを開始</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 支払い方法 */}
        <Card 
          title="支払い方法"
          icon={<CreditCard className="h-5 w-5 text-purple-500" />}
        >
          {paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {method.card.brand} •••• {method.card.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        有効期限: {method.card.expMonth}/{method.card.expYear}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-green-600 font-medium">デフォルト</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">支払い方法が登録されていません</p>
            </div>
          )}
        </Card>
      </PageLayout>
    </>
  );
};
