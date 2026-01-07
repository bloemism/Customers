import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, AlertCircle, ArrowLeft, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';

// API Base URL
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  return 'https://customers-three-rust.vercel.app';
};
const API_BASE_URL = getApiBaseUrl();

/**
 * Stripe Connect決済完了ページ
 * 決済完了後のデータ保存と表示を担当
 */
export const StripeConnectPaymentComplete: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('セッションIDが取得できませんでした');
      setLoading(false);
      return;
    }

    // 決済情報を取得してデータベースに保存
    handlePaymentComplete();
  }, [sessionId]);

  const handlePaymentComplete = async () => {
    if (!sessionId) return;

    setLoading(true);
    setError('');

    try {
      // 1. Stripe Checkout Sessionから決済情報を取得
      const sessionResponse = await fetch(`${API_BASE_URL}/api/get-checkout-session?session_id=${sessionId}`);
      if (!sessionResponse.ok) {
        throw new Error('決済情報の取得に失敗しました');
      }
      const sessionData = await sessionResponse.json();
      
      if (!sessionData.success || !sessionData.session) {
        throw new Error('決済セッションが見つかりませんでした');
      }

      const session = sessionData.session;
      const paymentIntentId = session.payment_intent;

      // 2. Payment Intentから詳細情報を取得
      const paymentIntentResponse = await fetch(`${API_BASE_URL}/api/get-payment-intent?payment_intent_id=${paymentIntentId}`);
      if (!paymentIntentResponse.ok) {
        throw new Error('決済詳細情報の取得に失敗しました');
      }
      const paymentIntentData = await paymentIntentResponse.json();
      
      if (!paymentIntentData.success || !paymentIntentData.paymentIntent) {
        throw new Error('決済詳細情報が見つかりませんでした');
      }

      const paymentIntent = paymentIntentData.paymentIntent;
      const metadata = paymentIntent.metadata || {};

      // 3. 決済データを準備
      const paymentInfo = {
        session_id: sessionId,
        payment_intent_id: paymentIntentId,
        amount: paymentIntent.amount, // JPYは円単位
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        customer_id: metadata.customer_id,
        store_id: metadata.store_id,
        payment_code: metadata.payment_code,
        store_name: metadata.store_name,
        points_used: parseInt(metadata.points_used || '0'),
        items: metadata.items ? JSON.parse(metadata.items) : [],
        connected_account_id: metadata.connected_account_id,
        application_fee_amount: parseInt(metadata.application_fee_amount || '0'),
        created_at: new Date().toISOString()
      };

      setPaymentData(paymentInfo);

      // 4. データベースに保存
      await savePaymentData(paymentInfo);

      setLoading(false);
    } catch (err) {
      console.error('決済完了処理エラー:', err);
      setError(err instanceof Error ? err.message : '決済完了処理に失敗しました');
      setLoading(false);
    }
  };

  const savePaymentData = async (paymentInfo: any) => {
    setSaving(true);

    try {
      // 1. 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      // 2. 顧客IDを取得（user.idまたはmetadata.customer_idから）
      let customerId = paymentInfo.customer_id;
      if (!customerId) {
        // customersテーブルからuser_idで検索
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (customerData) {
          customerId = customerData.id;
        }
      }

      // 3. ポイント計算（決済金額の5%）
      const pointsEarned = Math.floor(paymentInfo.amount * 0.05);
      const pointsUsed = paymentInfo.points_used || 0;
      const netPoints = pointsEarned - pointsUsed;

      // 4. purchase_historyテーブルに保存
      const { data: purchaseHistory, error: purchaseError } = await supabase
        .from('purchase_history')
        .insert([
          {
            customer_id: customerId,
            purchase_date: new Date().toISOString(),
            total_amount: paymentInfo.amount,
            tax_amount: Math.floor(paymentInfo.amount * 0.1), // 消費税10%
            points_earned: pointsEarned,
            points_used: pointsUsed,
            payment_method: 'stripe_connect',
            qr_payment_id: paymentInfo.payment_code,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (purchaseError) {
        console.error('購入履歴保存エラー:', purchaseError);
        throw new Error('購入履歴の保存に失敗しました');
      }

      // 5. purchase_itemsテーブルに保存
      if (paymentInfo.items && Array.isArray(paymentInfo.items) && purchaseHistory) {
        const purchaseItems = paymentInfo.items.map((item: any) => ({
          purchase_id: purchaseHistory.id,
          item_name: item.name || item.item_name || '商品',
          unit_price: item.unit_price || item.price || 0,
          quantity: item.quantity || 1,
          total_price: (item.unit_price || item.price || 0) * (item.quantity || 1),
          created_at: new Date().toISOString()
        }));

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(purchaseItems);

        if (itemsError) {
          console.error('購入品目保存エラー:', itemsError);
          // エラーが発生しても続行（購入履歴は保存済み）
        }
      }

      // 6. payment_transactionsテーブルに保存（店舗側用）
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert([
          {
            store_id: paymentInfo.store_id,
            customer_id: customerId,
            payment_code: paymentInfo.payment_code,
            stripe_payment_intent_id: paymentInfo.payment_intent_id,
            amount: paymentInfo.amount,
            currency: paymentInfo.currency || 'jpy',
            platform_fee: paymentInfo.application_fee_amount || 0,
            stripe_fee: 0, // Stripe手数料は後で計算
            store_amount: paymentInfo.amount - (paymentInfo.application_fee_amount || 0),
            status: paymentInfo.status === 'succeeded' ? 'succeeded' : 'pending',
            payment_method: 'stripe_connect',
            metadata: {
              session_id: paymentInfo.session_id,
              connected_account_id: paymentInfo.connected_account_id,
              items: paymentInfo.items,
              points_used: pointsUsed,
              points_earned: pointsEarned
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);

      if (transactionError) {
        console.error('決済トランザクション保存エラー:', transactionError);
        // エラーが発生しても続行（購入履歴は保存済み）
      }

      // 7. customer_paymentsテーブルに保存（既存のテーブル）
      const { error: customerPaymentError } = await supabase
        .from('customer_payments')
        .insert([
          {
            customer_id: customerId,
            store_id: paymentInfo.store_id,
            amount: paymentInfo.amount,
            points_earned: pointsEarned,
            points_used: pointsUsed,
            payment_method: 'stripe_connect',
            status: paymentInfo.status === 'succeeded' ? 'completed' : 'pending',
            payment_code: paymentInfo.payment_code,
            stripe_payment_intent_id: paymentInfo.payment_intent_id,
            created_at: new Date().toISOString()
          }
        ]);

      if (customerPaymentError) {
        console.error('顧客決済履歴保存エラー:', customerPaymentError);
        // エラーが発生しても続行
      }

      // 8. 顧客のポイントを更新
      if (customerId) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('total_points')
          .eq('id', customerId)
          .maybeSingle();

        const currentPoints = customerData?.total_points || 0;
        const newPoints = currentPoints + netPoints;

        // 現在のtotal_purchase_amountを取得してから更新
        const { data: currentCustomer } = await supabase
          .from('customers')
          .select('total_purchase_amount')
          .eq('id', customerId)
          .maybeSingle();

        const currentPurchaseAmount = currentCustomer?.total_purchase_amount || 0;
        const newPurchaseAmount = currentPurchaseAmount + paymentInfo.amount;

        const { error: updateError } = await supabase
          .from('customers')
          .update({
            total_points: newPoints,
            total_purchase_amount: newPurchaseAmount,
            last_purchase_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId);

        if (updateError) {
          console.error('顧客ポイント更新エラー:', updateError);
          // エラーが発生しても続行
        }
      }

      console.log('✅ 決済データの保存が完了しました');
    } catch (err) {
      console.error('データ保存エラー:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading || saving) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {saving ? '決済データを保存中...' : '決済情報を確認中...'}
          </h2>
          <p className="text-sm text-gray-600">
            {saving ? 'データベースに保存しています。しばらくお待ちください。' : '決済情報を取得しています。'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">エラーが発生しました</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/customer-menu')}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              メニューに戻る
            </button>
            <button
              onClick={() => navigate('/customer-payments')}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              決済履歴を確認
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">決済情報が見つかりませんでした</h2>
          <p className="text-sm text-gray-600 mb-6">
            決済は完了している可能性があります。決済履歴ページで確認してください。
          </p>
          <button
            onClick={() => navigate('/customer-payments')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            決済履歴を確認
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* 成功メッセージ */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">決済が完了しました</h1>
          <p className="text-sm text-gray-600">ありがとうございます。決済が正常に処理されました。</p>
        </div>

        {/* 決済情報 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">決済詳細</h2>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">店舗名:</span>
              <span className="font-medium text-gray-900">{paymentData.store_name || '不明'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">決済金額:</span>
              <span className="font-medium text-gray-900">¥{paymentData.amount.toLocaleString()}</span>
            </div>
            {paymentData.points_used > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">使用ポイント:</span>
                <span className="font-medium text-gray-900">-{paymentData.points_used} pt</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">獲得ポイント:</span>
              <span className="font-medium text-green-600">
                +{Math.floor(paymentData.amount * 0.05)} pt
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">決済方法:</span>
              <span className="font-medium text-gray-900">クレジットカード（Stripe Connect）</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">決済日時:</span>
              <span className="font-medium text-gray-900">
                {new Date(paymentData.created_at).toLocaleString('ja-JP')}
              </span>
            </div>
          </div>
        </div>

        {/* 購入品目 */}
        {paymentData.items && paymentData.items.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">購入品目</h2>
            <div className="space-y-2">
              {paymentData.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name || item.item_name || '商品'} {item.color ? `（${item.color}）` : ''} x {item.quantity || 1}
                  </span>
                  <span className="font-medium text-gray-900">
                    ¥{((item.unit_price || item.price || 0) * (item.quantity || 1)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/customer-menu')}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            メニューに戻る
          </button>
          <button
            onClick={() => navigate('/customer-payments')}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            決済履歴を確認
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeConnectPaymentComplete;

