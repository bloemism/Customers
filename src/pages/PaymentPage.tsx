import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, AlertCircle, Hash, Check } from 'lucide-react';
import type { PaymentData } from '../services/customerStripeService';
import { useCustomer } from '../contexts/CustomerContext';
import { supabase } from '../lib/supabase';
// API Base URL（ローカル環境ではローカルAPIサーバーを使用）
const getApiBaseUrl = () => {
  let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (!apiBaseUrl) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      apiBaseUrl = 'http://localhost:3000';
    } else {
      // 本番環境ではVercelのAPIエンドポイントを使用
      apiBaseUrl = 'https://customers-three-rust.vercel.app';
    }
  }
  return apiBaseUrl;
};

// 背景画像
const BG_IMAGE = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, loading: customerLoading, error: customerError, fetchCustomerData } = useCustomer();
  
  const [scannedData, setScannedData] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // 決済コード入力用の状態（統合版：5桁または6桁を自動判定）
  const [paymentCode, setPaymentCode] = useState(''); // 統合された決済コード（5桁または6桁）
  const [codeVerifying, setCodeVerifying] = useState(false);
  
  // 決済方法選択（クレジット/現金）
  const [selectedPaymentType, setSelectedPaymentType] = useState<'credit' | 'cash' | null>(null);
  const [paymentCodeData, setPaymentCodeData] = useState<any>(null);
  
  // Stripe Connect関連の状態
  const [storeStripeAccountId, setStoreStripeAccountId] = useState<string | null>(null);
  const [loadingStripeAccount, setLoadingStripeAccount] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<{ kind: 'success' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get('canceled') === 'true') {
      setError('カード決済がキャンセルされました。必要であればもう一度お試しください。');
    }
  }, [location.search]);
  
  // テスト用のStripe ConnectアカウントID（フォールバック用）
  const TEST_CONNECTED_ACCOUNT_ID = 'acct_1SmtPlHk8MTQ5wk4';

  // 決済コード検証（統合版：5桁または6桁を自動判定）
  const verifyPaymentCode = async (code: string) => {
    if (!code || (code.length !== 5 && code.length !== 6)) {
      setError('5桁または6桁の決済コードを入力してください');
      return;
    }

    setCodeVerifying(true);
    setError('');
    
    // コードタイプを自動判定（5桁は検索結果で credit5 / cash5 を確定）
    let codeType: 'cash5' | 'credit5' | 'long6';
    if (code.length === 6) {
      codeType = 'long6';
    } else {
      codeType = 'credit5';
    }

    try {
      let data = null;
      let codeError = null;
      let paymentData = null;

      if (code.length === 5) {
        // 5桁: まず payment_codes（店舗チェックアウトの標準）
        const pcResult = await supabase
          .from('payment_codes')
          .select('*, payment_data')
          .eq('code', code)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();
        data = pcResult.data;
        codeError = pcResult.error;
        if (data?.payment_data) {
          paymentData = data.payment_data;
          codeType = 'credit5';
        }
        // 見つからない・payment_data なし → 現金用コード経路
        if (!paymentData) {
          const cashResult = await supabase
            .from('cash_payment_codes')
            .select('*')
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .is('used_at', null)
            .maybeSingle();
          if (cashResult.data) {
            data = cashResult.data;
            const paymentResult = await supabase
              .from('payment_codes')
              .select('*, payment_data')
              .eq('code', code)
              .gt('expires_at', new Date().toISOString())
              .maybeSingle();
            if (paymentResult.data?.payment_data) {
              paymentData = paymentResult.data.payment_data;
              codeType = 'cash5';
            } else {
              codeError = { message: '決済情報が見つかりません' };
            }
          } else {
            const fallbackPc = await supabase
              .from('payment_codes')
              .select('*, payment_data')
              .eq('code', code)
              .gt('expires_at', new Date().toISOString())
              .maybeSingle();
            if (fallbackPc.data?.payment_data) {
              data = fallbackPc.data;
              paymentData = fallbackPc.data.payment_data;
              codeType = 'cash5';
            } else {
              codeError = cashResult.error || pcResult.error || { message: 'コードが見つかりません' };
            }
          }
        }
      } else if (codeType === 'long6') {
        // 遠距離決済用6桁コード: remote_invoice_codesテーブルから検索
        const remoteResult = await supabase
          .from('remote_invoice_codes')
          .select('*')
          .eq('code', code)
          .gt('expires_at', new Date().toISOString())
          .is('used_at', null)
          .maybeSingle(); // single()の代わりにmaybeSingle()を使用（406エラー回避）
        
        if (remoteResult.data) {
          data = remoteResult.data;
          // remote_invoice_codesにはpayment_dataがないので、payment_codesから取得を試みる
          const paymentResult = await supabase
            .from('payment_codes')
            .select('*, payment_data')
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle(); // single()の代わりにmaybeSingle()を使用（406エラー回避）
          
          if (paymentResult.data && paymentResult.data.payment_data) {
            paymentData = paymentResult.data.payment_data;
          } else {
            // payment_codesにない場合は、remote_invoice_codesの情報から構築
            codeError = { message: '決済情報が見つかりません' };
          }
        } else {
          codeError = remoteResult.error || { message: 'コードが見つかりません' };
        }
      }

      if (codeError || !data || !paymentData) {
        const errorMessage = codeError?.message || '無効な決済コードです。コードを確認してください。';
        console.error('決済コード検証エラー:', { codeError, data, paymentData });
        setError(errorMessage);
        setCodeVerifying(false);
        return;
      }

      // paymentDataの構造を確認して、正しいフィールド名を使用
      console.log('paymentData構造:', paymentData);
      console.log('data構造:', data);
      console.log('paymentData.items:', paymentData.items);
      if (paymentData.items && paymentData.items.length > 0) {
        console.log('最初のitem:', paymentData.items[0]);
      }
      
      // 決済金額の計算: ポイントを引いた後に消費税をかける
      const subtotal = paymentData.subtotal || 0;
      const pointsToUse = paymentData.pointsUsed || paymentData.points_used || paymentData.points_to_use || 0;
      
      // ポイントを引いた後の金額
      const afterPoints = Math.max(0, subtotal - pointsToUse);
      
      // ポイント引いた後の金額に消費税を計算（10%）
      const tax = Math.round(afterPoints * 0.1);
      
      // 最終金額: ポイント引いた後 + 消費税
      const calculatedAmount = afterPoints + tax;
      
      // totalAmountが存在する場合はそれを使用、なければ計算値を使用
      const finalAmount = paymentData.totalAmount || paymentData.total_amount || paymentData.amount || calculatedAmount;
      
      const paymentInfo: PaymentData = {
        store_id: paymentData.storeId || paymentData.store_id || data.store_id,
        store_name: paymentData.storeName || paymentData.store_name || '不明な店舗',
        amount: finalAmount,
        points_to_use: pointsToUse,
        items: paymentData.items || [],
        code: paymentCode
      };
      
      console.log('設定するpaymentInfo:', paymentInfo);

      setScannedData(paymentInfo);
      setPaymentCodeData({ ...data, payment_data: paymentData });
      
      // 店舗のStripe ConnectアカウントIDを取得
      if (paymentInfo.store_id) {
        await fetchStoreStripeAccount(paymentInfo.store_id);
      }
      
      setCodeVerifying(false);
    } catch (err) {
      setError('決済コードの検証中にエラーが発生しました');
      setCodeVerifying(false);
    }
  };

  // 店舗のStripe ConnectアカウントIDを取得
  const fetchStoreStripeAccount = async (storeId: string) => {
    setLoadingStripeAccount(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('stripe_account_id, stripe_charges_enabled, stripe_onboarding_completed')
        .eq('id', storeId)
        .maybeSingle();

      if (error) {
        console.error('店舗情報取得エラー:', error);
        setStoreStripeAccountId(TEST_CONNECTED_ACCOUNT_ID);
        return;
      }

      if (data?.stripe_account_id) {
        setStoreStripeAccountId(data.stripe_account_id);
        console.log('Stripe ConnectアカウントID取得:', data.stripe_account_id);
        console.log('アカウント状態:', {
          charges_enabled: data.stripe_charges_enabled,
          onboarding_completed: data.stripe_onboarding_completed
        });
      } else {
        console.warn('店舗が見つからないか Connect 未設定です。テスト用アカウントで続行します。');
        setStoreStripeAccountId(TEST_CONNECTED_ACCOUNT_ID);
        console.log('テスト用Stripe ConnectアカウントIDを使用:', TEST_CONNECTED_ACCOUNT_ID);
      }
    } catch (error) {
      console.error('アカウント取得エラー:', error);
      setStoreStripeAccountId(TEST_CONNECTED_ACCOUNT_ID);
    } finally {
      setLoadingStripeAccount(false);
    }
  };

  // 現金決済処理（customer_payments に記録。cash_payment_codes は使用済みに更新を試行）
  const handleCashPayment = async () => {
    if (!scannedData || !paymentCodeData) {
      setError('決済情報がありません。コードを再度確認してください。');
      return;
    }
    
    setProcessing(true);
    setError('');
    setPaymentBanner(null);

    try {
      const paymentData = paymentCodeData.payment_data as any;
      const totalAmount = scannedData.amount;
      
      const usedCode = paymentCode;

      const resolvedStoreId =
        paymentData.storeId ||
        paymentData.store_id ||
        scannedData.store_id ||
        paymentCodeData?.store_id;

      if (!resolvedStoreId) {
        setError('店舗IDが取得できません。決済コードを再入力するか店舗に連絡してください。');
        setProcessing(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      let customerId = customer?.id;
      if (!customerId && user) {
        const { data: crow } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        customerId = crow?.id;
      }

      if (!customerId) {
        setError(
          '顧客プロフィールが登録されていないため、決済履歴に記録できません。メニューから会員情報を登録してからお試しください。'
        );
        setProcessing(false);
        return;
      }

      if (!user?.id) {
        setError('ログインセッションが無効です。再度ログインしてからお試しください。');
        setProcessing(false);
        return;
      }

      const pointsUsed = scannedData.points_to_use ?? 0;
      const pointsEarned = Math.floor(totalAmount * 0.05);
      const payment_data = {
        ...paymentData,
        items: paymentData.items ?? scannedData.items ?? [],
        store_name: paymentData.storeName || paymentData.store_name || scannedData.store_name,
        storeName: paymentData.storeName || paymentData.store_name,
        paymentCode: usedCode,
        totalAmount,
        subtotal: paymentData.subtotal,
        tax: paymentData.tax
      };

      const insertRow: Record<string, unknown> = {
        store_id: String(resolvedStoreId),
        amount: Math.round(totalAmount),
        points_earned: pointsEarned,
        points_used: pointsUsed,
        payment_method: 'cash',
        status: 'completed',
        payment_code: usedCode,
        payment_data,
        created_at: new Date().toISOString(),
        // RLS: customers_can_insert_own_payments は auth.uid()::text = user_id を要求
        user_id: user.id
      };
      if (customerId) insertRow.customer_id = String(customerId);

      const { error: cpError } = await supabase.from('customer_payments').insert(insertRow);

      if (cpError) {
        console.error('customer_payments（現金）:', cpError);
        setError(
          cpError.message ||
            '決済履歴の保存に失敗しました（customer_payments の RLS またはカラムを確認してください）'
        );
        setProcessing(false);
        return;
      }

      const { error: markErr } = await supabase
        .from('cash_payment_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('code', usedCode)
        .is('used_at', null);
      if (markErr) {
        console.warn('cash_payment_codes 使用済み更新（無視可）:', markErr);
      }

      await fetchCustomerData();
      setPaymentBanner({
        kind: 'success',
        message: `現金決済を記録しました（¥${Math.round(totalAmount).toLocaleString()}）。店舗レジでお支払いください。`
      });
      setScannedData(null);
      setPaymentCodeData(null);
      setSelectedPaymentType(null);
      setPaymentCode('');
      setStoreStripeAccountId(null);

      window.setTimeout(() => {
        setPaymentBanner(null);
        navigate('/customer-menu', {
          state: {
            paymentNotice: '現金決済を記録しました。店舗レジでお支払いください。'
          }
        });
      }, 2200);
      
    } catch (err) {
      setError('現金決済処理中にエラーが発生しました');
    } finally {
      setProcessing(false);
    }
  };

  // クレジット決済処理（Stripe Connect使用）
  const handleCreditPayment = async () => {
    if (!scannedData) return;
    
    // Stripe ConnectアカウントIDがまだ取得されていない場合は再取得を試みる
    if (!storeStripeAccountId && scannedData.store_id) {
      await fetchStoreStripeAccount(scannedData.store_id);
    }
    
    // アカウントIDが取得できない場合は、テスト用アカウントIDを使用
    const connectedAccountId = storeStripeAccountId || TEST_CONNECTED_ACCOUNT_ID;
    
    if (!connectedAccountId) {
      setError(`この店舗（${scannedData.store_name}）はStripe Connectアカウントが設定されていません。店舗オーナーに連絡してください。`);
      return;
    }
    
    console.log('使用するStripe ConnectアカウントID:', connectedAccountId);
    
    setProcessing(true);
    setError('');

    try {
      // 決済金額（日本円はそのまま送信）
      const amountInSmallestUnit = Math.round(scannedData.amount || 0);
      const platformFeeRate = 0.03; // 3%のプラットフォーム手数料
      const applicationFeeAmount = Math.round(amountInSmallestUnit * platformFeeRate);
      
      // 商品名を構築（品目、色、数、単価を含む）
      let productName = 'お買い物';
      if (scannedData.items && scannedData.items.length > 0) {
        const itemDescriptions = scannedData.items.map((item: any) => {
          const name = item.name || item.item_name || '商品';
          const color = item.color ? `（${item.color}）` : '';
          const quantity = item.quantity || 1;
          const unitPrice = item.unit_price || item.price || 0;
          return `${name}${color} x${quantity} @¥${unitPrice.toLocaleString()}`;
        });
        productName = itemDescriptions.join(', ');
        // Stripeの制限（500文字）に合わせて切り詰め
        if (productName.length > 500) {
          productName = productName.substring(0, 497) + '...';
        }
      }
      
      console.log('Stripe Checkoutに送信する情報:', {
        amount: amountInSmallestUnit,
        product_name: productName,
        store_name: scannedData.store_name,
        items_count: scannedData.items?.length || 0
      });

      console.log('Stripe Connect決済開始:', {
        amount: amountInSmallestUnit,
        connected_account_id: connectedAccountId,
        application_fee_amount: applicationFeeAmount,
        product_name: productName,
        is_test_account: connectedAccountId === TEST_CONNECTED_ACCOUNT_ID
      });

      // Stripe Connect決済Intent作成
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/create-connect-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInSmallestUnit, // 日本円（JPY）はそのまま円単位で送信
          currency: 'jpy',
          connected_account_id: connectedAccountId,
          application_fee_amount: applicationFeeAmount, // プラットフォーム手数料（円単位）
          product_name: productName,
          items: scannedData.items || [], // 品目情報を送信
          frontend_origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          cancel_path: '/store-payment',
          metadata: {
            payment_type: 'stripe_connect_standard',
            connected_account_id: connectedAccountId,
            store_id: scannedData.store_id,
            store_name: scannedData.store_name || '',
            payment_code: scannedData.code || '',
            points_used: scannedData.points_to_use?.toString() || '0',
            platform_fee_rate: platformFeeRate.toString(),
            total_amount: amountInSmallestUnit.toString(),
            is_test_account: (connectedAccountId === TEST_CONNECTED_ACCOUNT_ID).toString(),
            items: JSON.stringify(scannedData.items || []), // 品目情報をJSON文字列として保存
            customer_id: customer?.id || '', // 顧客IDを追加
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
        
        let errorMessage = errorData.error || `Payment Intentの作成に失敗しました (${response.status})`;
        
        if (errorData.charges_enabled === false) {
          errorMessage += '\n\n⚠️ 連結アカウントで決済が有効になっていません。';
          if (errorData.details_submitted === false) {
            errorMessage += '\nオンボーディングを完了する必要があります。';
          }
        }
        
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) {
        throw new Error(`空のレスポンスが返されました (${response.status})`);
      }
      
      const result = JSON.parse(text);
      console.log('Stripe Connect決済Intent作成成功:', result);

      const checkoutUrl =
        result.url ||
        result.checkout_url ||
        (result.sessionId ? `https://checkout.stripe.com/c/pay/${result.sessionId}` : null);

      if (result.success && checkoutUrl) {
        console.log('Stripe Checkoutにリダイレクト:', checkoutUrl);
        window.location.href = checkoutUrl;
      } else {
        console.error('決済URLが取得できませんでした:', result);
        throw new Error('決済URLの取得に失敗しました');
      }
    } catch (err) {
      console.error('決済処理エラー:', err);
      setError(err instanceof Error ? err.message : '決済処理中にエラーが発生しました');
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentType) {
      setError('決済方法を選択してください');
      return;
    }

    if (selectedPaymentType === 'credit') {
      await handleCreditPayment();
    } else if (selectedPaymentType === 'cash') {
      await handleCashPayment();
    }
  };

  // エラー表示
  if (customerError) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#FAF8F5' }}
      >
        <div 
          className="text-center p-8 rounded-sm max-w-md"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1px solid #E0D6C8'
          }}
        >
          <h2 className="text-xl mb-4" style={{ color: '#DC2626' }}>エラーが発生しました</h2>
          <p className="mb-4" style={{ color: '#2D2A26', fontWeight: 500 }}>{customerError}</p>
          <button
            onClick={() => navigate('/customer-menu')}
            className="px-6 py-3 rounded-sm text-sm tracking-wide transition-all duration-300"
            style={{ backgroundColor: '#5C6B4A', color: '#FAF8F5' }}
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  // ローディング中
  if (customerLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FAF8F5' }}
      >
        <div className="text-center">
          <div 
            className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: '#E0D6C8', borderTopColor: '#5C6B4A' }}
          />
          <p className="mt-4 text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 無地背景 */}

      <div className="relative z-10 max-w-xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/customer-menu')}
            className="flex items-center gap-2 text-sm transition-all duration-300 mb-6"
            style={{ color: '#2D2A26', fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" />
            メニューへ戻る
          </button>

          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6" style={{ color: '#5C6B4A' }} />
            <h1 
              className="text-2xl"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26'
              }}
            >
              店舗決済
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>
            決済コードを入力してお支払い
          </p>
          {paymentBanner && (
            <div
              className="mt-4 p-4 rounded-sm text-sm"
              style={{
                backgroundColor: paymentBanner.kind === 'success' ? '#E8EDE4' : '#EFF6FF',
                border: `1px solid ${paymentBanner.kind === 'success' ? '#D1DBC9' : '#BFDBFE'}`,
                color: '#2D2A26',
                fontWeight: 500
              }}
              role="status"
            >
              {paymentBanner.message}
            </div>
          )}
        </div>

        {/* 決済コード入力カード */}
        <div 
          className="rounded-sm p-6 md:p-8 mb-6"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1px solid #E0D6C8'
          }}
        >
          {!scannedData ? (
            <div className="space-y-6">
              {/* 決済コード入力 */}
              <div className="text-center">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: '#F5F0E8' }}
                >
                  <Hash className="w-10 h-10" style={{ color: '#5C6B4A' }} />
                </div>
                <h2 
                  className="text-xl mb-2"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2D2A26'
                  }}
                >
                  決済コードを入力
                  </h2>
                <p className="text-sm mb-6" style={{ color: '#3D3A36', fontWeight: 500 }}>
                  店舗から伝えられた決済コードを入力してください
                </p>

                {/* 統合された決済コード入力フィールド（5桁または6桁を自動判定） */}
                <div className="max-w-md mx-auto">
                  <div>
                    <label className="block text-sm mb-2 text-left" style={{ color: '#2D2A26', fontWeight: 600 }}>
                      決済コード
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={paymentCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 6) {
                            setPaymentCode(value);
                            setError('');
                          }
                        }}
                        placeholder={paymentCode.length <= 5 ? "00000" : "000000"}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-center text-xl sm:text-2xl tracking-[0.3em] rounded-sm transition-all duration-200"
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          backgroundColor: '#FDFCFA',
                          border: '2px solid #E0D6C8',
                          color: '#3D4A35',
                          fontWeight: 600
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#5C6B4A';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E0D6C8';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        onClick={() => verifyPaymentCode(paymentCode)}
                        disabled={codeVerifying || (paymentCode.length !== 5 && paymentCode.length !== 6)}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-sm text-xs sm:text-sm tracking-wide transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
                        style={{ 
                          backgroundColor: '#5C6B4A',
                          color: '#FAF8F5'
                        }}
                      >
                        {codeVerifying ? '確認中...' : '確認'}
                      </button>
                    </div>
                    <p className="text-xs mt-1 text-left" style={{ color: '#3D3A36', fontWeight: 500 }}>
                      {paymentCode.length === 6 ? '遠距離決済（1ヶ月間有効）' : '店舗決済（5分間有効）'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 決済情報確認 */}
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#E8EDE4' }}
                >
                  <Check className="w-8 h-8" style={{ color: '#5C6B4A' }} />
                </div>
                <h2 
                  className="text-xl mb-2"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2D2A26'
                  }}
                >
                  決済情報確認
                </h2>
              </div>

              {/* 決済詳細 */}
              <div 
                className="rounded-sm p-5"
                style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}
              >
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: '#2D2A26', fontWeight: 500 }}>店舗名</span>
                    <span style={{ color: '#2D2A26', fontWeight: 500 }}>{scannedData.store_name}</span>
                  </div>
                  
                  {/* 購入品目テーブル */}
                  {scannedData.items && scannedData.items.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2" style={{ color: '#2D2A26' }}>購入品目</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #E0D6C8' }}>
                              <th className="text-left py-2 px-2" style={{ color: '#2D2A26', fontWeight: 600 }}>品目</th>
                              <th className="text-center py-2 px-2" style={{ color: '#2D2A26', fontWeight: 600 }}>本数</th>
                              <th className="text-right py-2 px-2" style={{ color: '#2D2A26', fontWeight: 600 }}>単価</th>
                              <th className="text-right py-2 px-2" style={{ color: '#2D2A26', fontWeight: 600 }}>小計</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(scannedData.items ?? []).map((item: any, index: number, arr) => (
                              <tr key={index} style={{ borderBottom: index < arr.length - 1 ? '1px solid #E0D6C8' : 'none' }}>
                                <td className="py-2 px-2" style={{ color: '#2D2A26' }}>{item.name || item.item_name || '不明'}</td>
                                <td className="text-center py-2 px-2" style={{ color: '#2D2A26' }}>{item.quantity || 0}</td>
                                <td className="text-right py-2 px-2" style={{ color: '#2D2A26' }}>
                                  ¥{(() => {
                                    // 単価の計算: 複数のフィールド名に対応
                                    // unit_price, price, unitPrice をチェック
                                    // なければ total_price/quantity または totalPrice/quantity
                                    const unitPrice = item.unit_price ?? item.price ?? item.unitPrice ?? 
                                      (item.total_price ? (item.total_price / (item.quantity || 1)) : 
                                      (item.totalPrice ? (item.totalPrice / (item.quantity || 1)) : 0));
                                    return (unitPrice || 0).toLocaleString();
                                  })()}
                                </td>
                                <td className="text-right py-2 px-2" style={{ color: '#2D2A26', fontWeight: 500 }}>
                                  ¥{(() => {
                                    // 小計の計算: 複数のフィールド名に対応
                                    const quantity = item.quantity ?? 1;
                                    const unitPrice = item.unit_price ?? item.unitPrice ?? item.price ?? 0;
                                    
                                    // total_price/totalPriceが存在する場合
                                    const totalPriceValue = item.total_price ?? item.totalPrice;
                                    
                                    // total_priceが単価と同じ値の場合は、unit_price*quantityを使用
                                    // そうでない場合は、total_priceを使用
                                    if (totalPriceValue && totalPriceValue !== unitPrice && totalPriceValue >= unitPrice * quantity) {
                                      return (totalPriceValue || 0).toLocaleString();
                                    } else {
                                      // unit_price*quantityで計算
                                      return ((unitPrice * quantity) || 0).toLocaleString();
                                    }
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {paymentCodeData?.payment_data && (
                    <>
                      <div className="flex justify-between">
                        <span style={{ color: '#2D2A26', fontWeight: 500 }}>小計</span>
                        <span style={{ color: '#2D2A26' }}>¥{((paymentCodeData.payment_data.subtotal ?? 0) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#2D2A26', fontWeight: 500 }}>使用ポイント</span>
                        <span style={{ color: '#C4856C' }}>-{scannedData.points_to_use || 0} pt</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#2D2A26', fontWeight: 500 }}>ポイント引いた後</span>
                        <span style={{ color: '#2D2A26' }}>
                          ¥{Math.max(0, ((paymentCodeData.payment_data.subtotal ?? 0) || 0) - (scannedData.points_to_use || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#2D2A26', fontWeight: 500 }}>消費税（10%）</span>
                        <span style={{ color: '#2D2A26' }}>
                          ¥{Math.round(Math.max(0, ((paymentCodeData.payment_data.subtotal ?? 0) || 0) - (scannedData.points_to_use || 0)) * 0.1).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  <div 
                    className="pt-3 flex justify-between"
                    style={{ borderTop: '1px solid #E0D6C8' }}
                  >
                    <span style={{ color: '#2D2A26', fontWeight: 500 }}>お支払い金額</span>
                    <span 
                      className="text-xl"
                      style={{ 
                        fontFamily: "'Cormorant Garamond', serif",
                        color: '#3D4A35',
                        fontWeight: 600
                      }}
                    >
                      ¥{((scannedData.amount ?? 0) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 決済方法選択 */}
              <div>
                <p 
                  className="text-xs tracking-[0.2em] mb-4 text-center"
                  style={{ color: '#3D3A36', fontWeight: 500 }}
                >
                  PAYMENT METHOD
                </p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* クレジット決済 */}
                  <button
                    onClick={() => setSelectedPaymentType('credit')}
                    className="p-4 sm:p-5 rounded-sm transition-all duration-300"
                    style={{
                      backgroundColor: selectedPaymentType === 'credit' ? '#5C6B4A' : '#FDFCFA',
                      border: `2px solid ${selectedPaymentType === 'credit' ? '#5C6B4A' : '#E0D6C8'}`,
                      color: selectedPaymentType === 'credit' ? '#FAF8F5' : '#2D2A26'
                    }}
                  >
                    <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-medium">クレジット</p>
                    <p className="text-xs mt-1" style={{ opacity: 0.7 }}>Stripe決済</p>
                  </button>
                  
                  {/* 現金決済（クレジットと同じ画面で記録） */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType('cash')}
                    className="p-4 sm:p-5 rounded-sm transition-all duration-300"
                    style={{
                      backgroundColor: selectedPaymentType === 'cash' ? '#5C6B4A' : '#FDFCFA',
                      border: `2px solid ${selectedPaymentType === 'cash' ? '#5C6B4A' : '#E0D6C8'}`,
                      color: selectedPaymentType === 'cash' ? '#FAF8F5' : '#2D2A26'
                    }}
                  >
                    <div className="text-2xl sm:text-3xl mb-2">💴</div>
                    <p className="text-xs sm:text-sm font-medium">現金</p>
                    <p className="text-xs mt-1" style={{ opacity: selectedPaymentType === 'cash' ? 0.9 : 0.65 }}>
                      店舗レジでお支払い
                    </p>
                  </button>
                </div>
              </div>

              {/* 選択された決済方法の説明 */}
              {selectedPaymentType === 'credit' && (
                <div 
                  className="rounded-sm p-4"
                  style={{ backgroundColor: '#E8EDE4', border: '1px solid #D1DBC9' }}
                >
                  <p className="text-sm" style={{ color: '#5C6B4A' }}>
                    Stripeの安全な決済システムでクレジットカードでお支払いいただけます。
                  </p>
                </div>
              )}
              {selectedPaymentType === 'cash' && (
                <div 
                  className="rounded-sm p-4"
                  style={{ backgroundColor: '#E8EDE4', border: '1px solid #D1DBC9' }}
                >
                  <p className="text-sm" style={{ color: '#5C6B4A' }}>
                    アプリでは決済記録のみ行います。実際のお支払いは店舗レジで現金にてお願いします。
                  </p>
                </div>
              )}

              {/* 注意事項 */}
              <div 
                className="rounded-sm p-4"
                style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#92400E' }} />
                  <div className="text-sm" style={{ color: '#92400E' }}>
                    <p className="font-medium mb-1">ご注意</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 決済金額の5%がポイントとして付与されます</li>
                          <li>• 決済処理中はページを閉じないでください</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setScannedData(null);
                    setPaymentCodeData(null);
                    setSelectedPaymentType(null);
                    setPaymentCode('');
                    setStoreStripeAccountId(null);
                    setError('');
                  }}
                  className="flex-1 py-3 sm:py-4 rounded-sm text-xs sm:text-sm tracking-wide transition-all duration-300"
                  style={{ 
                    backgroundColor: '#F5F0E8',
                    color: '#2D2A26',
                    fontWeight: 500,
                    border: '1px solid #E0D6C8'
                  }}
                >
                  やり直す
                </button>
                {selectedPaymentType && (
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="flex-1 py-3 sm:py-4 rounded-sm text-xs sm:text-sm tracking-wide transition-all duration-300 disabled:opacity-50"
                    style={{ 
                      backgroundColor: '#5C6B4A',
                      color: '#FAF8F5'
                    }}
                  >
                    {processing ? '処理中...' : '決済を実行'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div 
              className="mt-6 p-4 rounded-sm"
              style={{ 
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA'
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#DC2626' }} />
                  <span className="text-sm" style={{ color: '#DC2626' }}>
                    {error.includes('登録ページ:') ? error.split('登録ページ:')[0] : error}
                  </span>
                </div>
                {error.includes('登録ページ:') && scannedData?.store_id && (
                  <a
                    href={`/stripe-connect-onboarding?store_id=${encodeURIComponent(scannedData.store_id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 rounded-sm text-sm font-medium transition-colors text-center"
                    style={{
                      backgroundColor: '#3D4A35',
                      color: '#FAF8F5',
                      border: '1px solid #2D3A25'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2D3A25';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3D4A35';
                    }}
                  >
                    Stripe Connectに登録する
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
export const StorePayment = PaymentPage;
