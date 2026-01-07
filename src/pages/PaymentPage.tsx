import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, AlertCircle, Hash, Check } from 'lucide-react';
import { CustomerStripeService, type PaymentData } from '../services/customerStripeService';
import { useCustomer } from '../contexts/CustomerContext';
import { supabase } from '../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

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

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// 背景画像
const BG_IMAGE = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { customer, loading: customerLoading, error: customerError } = useCustomer();
  
  const [scannedData, setScannedData] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // 決済コード入力用の状態（統合版：5桁または6桁を自動判定）
  const [paymentCode, setPaymentCode] = useState(''); // 統合された決済コード（5桁または6桁）
  const [codeVerifying, setCodeVerifying] = useState(false);
  
  // 決済方法選択（クレジット/現金）
  const [selectedPaymentType, setSelectedPaymentType] = useState<'credit' | 'cash' | null>(null);
  const [paymentCodeData, setPaymentCodeData] = useState<any>(null);
  const [detectedCodeType, setDetectedCodeType] = useState<'cash5' | 'credit5' | 'long6' | null>(null);
  
  // Stripe Connect関連の状態
  const [storeStripeAccountId, setStoreStripeAccountId] = useState<string | null>(null);
  const [loadingStripeAccount, setLoadingStripeAccount] = useState(false);
  
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
    
    // コードタイプを自動判定
    let codeType: 'cash5' | 'credit5' | 'long6';
    if (code.length === 6) {
      codeType = 'long6';
    } else {
      // 5桁の場合は、まずpayment_codesから検索を試みる（クレジット用）
      // 見つからなければcash_payment_codesを試す（現金用）
      codeType = 'credit5'; // デフォルトはクレジット用
    }
    
    setDetectedCodeType(codeType);

    try {
      let data = null;
      let codeError = null;
      let paymentData = null;

      // コードタイプに応じて適切なテーブルから検索
      if (codeType === 'cash5') {
        // 現金用5桁コード: cash_payment_codesテーブルから検索
        // 403エラー回避のため、まずpayment_codesから検索を試みる
        const cashResult = await supabase
          .from('cash_payment_codes')
          .select('*')
          .eq('code', code)
          .gt('expires_at', new Date().toISOString())
          .is('used_at', null)
          .maybeSingle(); // single()の代わりにmaybeSingle()を使用（エラーを回避）
        
        if (cashResult.data) {
          data = cashResult.data;
          // cash_payment_codesにはpayment_dataがないので、payment_codesから取得を試みる
          const paymentResult = await supabase
            .from('payment_codes')
            .select('*, payment_data')
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle(); // single()の代わりにmaybeSingle()を使用（406エラー回避）
          
          if (paymentResult.data && paymentResult.data.payment_data) {
            paymentData = paymentResult.data.payment_data;
          } else {
            // payment_codesにない場合は、cash_payment_codesの情報から構築
            codeError = { message: '決済情報が見つかりません' };
          }
        } else {
          // cash_payment_codesにない場合は、payment_codesから検索（フォールバック）
          const paymentResult = await supabase
            .from('payment_codes')
            .select('*, payment_data')
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle(); // single()の代わりにmaybeSingle()を使用（406エラー回避）
          
          if (paymentResult.data) {
            data = paymentResult.data;
            paymentData = paymentResult.data.payment_data;
          } else {
            codeError = paymentResult.error || { message: 'コードが見つかりません' };
          }
        }
      } else if (codeType === 'credit5') {
        // クレジット決済用5桁コード: payment_codesテーブルから検索
        const result = await supabase
          .from('payment_codes')
          .select('*, payment_data')
          .eq('code', code)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle(); // single()の代わりにmaybeSingle()を使用（406エラー回避）
        data = result.data;
        codeError = result.error;
        if (data) {
          paymentData = data.payment_data;
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
        items: paymentData.items || []
      };
      
      console.log('設定するpaymentInfo:', paymentInfo);

      setScannedData(paymentInfo);
      setPaymentCodeData({ ...data, payment_data: paymentData });
      setDetectedCodeType(codeType);
      
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
        .single();

      if (error) {
        console.error('店舗情報取得エラー:', error);
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
        console.warn('この店舗はStripe Connectアカウントが設定されていません。テスト用アカウントを使用します。');
        // テスト環境では、フォールバックとしてテスト用アカウントIDを使用
        setStoreStripeAccountId(TEST_CONNECTED_ACCOUNT_ID);
        console.log('テスト用Stripe ConnectアカウントIDを使用:', TEST_CONNECTED_ACCOUNT_ID);
      }
    } catch (error) {
      console.error('アカウント取得エラー:', error);
    } finally {
      setLoadingStripeAccount(false);
    }
  };

  // 現金決済処理
  const handleCashPayment = async () => {
    if (!scannedData || !paymentCodeData || !detectedCodeType) return;
    
    setProcessing(true);
    setError('');

    try {
      const paymentData = paymentCodeData.payment_data as any;
      const totalAmount = scannedData.amount;
      const feeAmount = Math.round(totalAmount * 0.03);
      
      // 使用したコードを取得
      const usedCode = paymentCode;

      const { error: cashError } = await supabase
        .from('cash_payments')
        .insert({
          payment_code: usedCode,
          store_id: paymentData.storeId,
          customer_id: customer?.id || null,
          total_amount: totalAmount,
          fee_amount: feeAmount,
          payment_data: paymentData,
          payment_method: 'cash',
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (cashError) {
        setError('現金決済の記録に失敗しました');
        setProcessing(false);
        return;
      }

      alert('現金決済が完了しました。店舗で直接お支払いください。');
      
      setScannedData(null);
      setPaymentCodeData(null);
      setSelectedPaymentType(null);
      setDetectedCodeType(null);
      setPaymentCode('');
      
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

      // checkout_urlまたはurlのいずれかを使用
      const checkoutUrl = result.checkout_url || result.url;
      
      if (result.success && checkoutUrl) {
        console.log('Stripe Checkoutにリダイレクト:', checkoutUrl);
        // Stripe Checkoutにリダイレクト
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
                            {scannedData.items.map((item: any, index: number) => (
                              <tr key={index} style={{ borderBottom: index < scannedData.items.length - 1 ? '1px solid #E0D6C8' : 'none' }}>
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
                  
                  {/* 現金決済 */}
                  <button
                    onClick={() => {
                      navigate('/cash-payment', { 
                        state: { 
                          paymentCode: paymentCode, 
                          paymentCodeData: paymentCodeData || null,
                          scannedData 
                        } 
                      });
                    }}
                    className="p-4 sm:p-5 rounded-sm transition-all duration-300"
                    style={{
                      backgroundColor: '#FDFCFA',
                      border: '2px solid #E0D6C8',
                      color: '#2D2A26'
                    }}
                  >
                    <div className="text-2xl sm:text-3xl mb-2">💴</div>
                    <p className="text-xs sm:text-sm font-medium">現金</p>
                    <p className="text-xs mt-1" style={{ color: '#8A857E' }}>店舗でお支払い</p>
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
                    setActiveCodeType(null);
                    setCashCode5('');
                    setCreditCode5('');
                    setLongDistanceCode6('');
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
