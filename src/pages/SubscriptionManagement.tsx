import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { SimpleStripeService } from '../services/simpleStripeService';
import type { EligibilityCheck } from '../services/simpleStripeService';
import { SUBSCRIPTION_PRODUCTS, AVAILABLE_FEATURES } from '../lib/stripe';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  planType: 'FLORIST' | 'FLOWER_SCHOOL';
  eligibilityCheck?: EligibilityCheck;
}

const SubscriptionManagement: React.FC = () => {
  const { user } = useSimpleAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibilityChecks, setEligibilityChecks] = useState<{[key: string]: EligibilityCheck}>({});

  // 2つのプランを定義
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: SUBSCRIPTION_PRODUCTS.FLORIST.id,
      name: SUBSCRIPTION_PRODUCTS.FLORIST.name,
      description: SUBSCRIPTION_PRODUCTS.FLORIST.description,
      price: SUBSCRIPTION_PRODUCTS.FLORIST.price,
      planType: 'FLORIST'
    },
    {
      id: SUBSCRIPTION_PRODUCTS.FLOWER_SCHOOL.id,
      name: SUBSCRIPTION_PRODUCTS.FLOWER_SCHOOL.name,
      description: SUBSCRIPTION_PRODUCTS.FLOWER_SCHOOL.description,
      price: SUBSCRIPTION_PRODUCTS.FLOWER_SCHOOL.price,
      planType: 'FLOWER_SCHOOL'
    }
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.email) {
      console.log('ユーザーが認証されていません');
      return;
    }

    try {
      setLoading(true);
      console.log('データ読み込み開始:', user.email);
      
      // サブスクリプション状態とペイメントメソッドを取得
      const [status, methods] = await Promise.all([
        SimpleStripeService.getSubscriptionStatus(user.email),
        SimpleStripeService.getPaymentMethods(user.email)
      ]);

      console.log('取得したデータ:', { status, methods });
      setSubscriptionStatus(status);
      setPaymentMethods(methods);

      // 各プランの条件チェックを実行
      const checks: {[key: string]: EligibilityCheck} = {};
      
      for (const plan of subscriptionPlans) {
        try {
          if (plan.planType === 'FLORIST') {
            checks[plan.id] = await SimpleStripeService.checkFloristEligibility(user.email);
          } else {
            checks[plan.id] = await SimpleStripeService.checkFlowerSchoolEligibility(user.email);
          }
          console.log(`${plan.name}の条件チェック結果:`, checks[plan.id]);
        } catch (error) {
          console.error(`${plan.name}の条件チェックエラー:`, error);
          checks[plan.id] = {
            isEligible: false,
            reason: '条件チェック中にエラーが発生しました'
          };
        }
      }

      setEligibilityChecks(checks);
      console.log('すべての条件チェック完了:', checks);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: 'FLORIST' | 'FLOWER_SCHOOL') => {
    if (!user?.email) {
      alert('ログインが必要です');
      return;
    }

    try {
      await SimpleStripeService.createSubscription(user.email, planType);
    } catch (error) {
      console.error('サブスクリプション作成エラー:', error);
      alert(error instanceof Error ? error.message : 'サブスクリプション作成に失敗しました');
    }
  };

  const cancelSubscription = async () => {
    // TODO: サブスクリプションキャンセル機能を実装
    console.log('サブスクリプションキャンセル機能は後で実装します');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">サブスクリプション管理</h1>
          <p className="text-gray-600">プランを選択してサービスを開始してください</p>
        </div>

        {/* 現在のサブスクリプション状態 */}
        {subscriptionStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">現在のサブスクリプション</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">ステータス</p>
                <p className="font-medium">{subscriptionStatus.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">プラン</p>
                <p className="font-medium">{subscriptionStatus.planName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">開始日</p>
                <p className="font-medium">{new Date(subscriptionStatus.currentPeriodStart).toLocaleDateString('ja-JP')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">終了日</p>
                <p className="font-medium">{new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString('ja-JP')}</p>
              </div>
            </div>
          </div>
        )}

        {/* プラン選択 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {subscriptionPlans.map((plan) => {
            const eligibilityCheck = eligibilityChecks[plan.id];
            const isEligible = eligibilityCheck?.isEligible ?? false;
            const planDetails = SUBSCRIPTION_PRODUCTS[plan.planType];
            
            return (
              <div key={plan.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="text-3xl font-bold text-blue-600 mb-6">
                    ¥{plan.price.toLocaleString()}
                    <span className="text-lg font-normal text-gray-500">/月</span>
                  </div>

                  {/* プラン機能一覧 */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">利用可能な機能</h4>
                    <div className="space-y-2">
                      {planDetails.features.map((feature) => (
                        <div key={feature} className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-sm text-gray-700">{AVAILABLE_FEATURES[feature as keyof typeof AVAILABLE_FEATURES]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 条件チェック結果 */}
                  {eligibilityCheck && (
                    <div className={`p-4 rounded-lg mb-4 ${
                      isEligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          isEligible ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className={`font-medium ${
                            isEligible ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {isEligible ? '条件を満たしています' : '条件を満たしていません'}
                          </p>
                          {!isEligible && eligibilityCheck.reason && (
                            <p className="text-sm text-red-600 mt-1">{eligibilityCheck.reason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSubscribe(plan.planType)}
                    disabled={!isEligible}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isEligible
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isEligible ? 'プラン開始' : '条件未達成'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ペイメントメソッド */}
        {paymentMethods.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">登録済みの支払い方法</h2>
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{method.brand} •••• {method.last4}</p>
                    <p className="text-sm text-gray-600">有効期限: {method.expMonth}/{method.expYear}</p>
                  </div>
                  <span className="text-sm text-gray-500">デフォルト</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
