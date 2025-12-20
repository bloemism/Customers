import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, AlertCircle, Hash, Check } from 'lucide-react';
import { CustomerStripeService, type PaymentData } from '../services/customerStripeService';
import { useCustomer } from '../contexts/CustomerContext';
import { supabase } from '../lib/supabase';

// 背景画像
const BG_IMAGE = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { customer, loading: customerLoading, error: customerError } = useCustomer();
  
  const [scannedData, setScannedData] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // 決済コード入力用の状態（3種類）
  const [cashCode5, setCashCode5] = useState(''); // 現金用5桁コード
  const [creditCode5, setCreditCode5] = useState(''); // クレジット決済用5桁コード
  const [longDistanceCode6, setLongDistanceCode6] = useState(''); // 遠距離決済用6桁コード
  const [codeVerifying, setCodeVerifying] = useState(false);
  
  // 決済方法選択（クレジット/現金）
  const [selectedPaymentType, setSelectedPaymentType] = useState<'credit' | 'cash' | null>(null);
  const [paymentCodeData, setPaymentCodeData] = useState<any>(null);
  const [activeCodeType, setActiveCodeType] = useState<'cash5' | 'credit5' | 'long6' | null>(null);

  // 決済コード検証（3種類対応）
  const verifyPaymentCode = async (code: string, codeType: 'cash5' | 'credit5' | 'long6') => {
    if (!code || (codeType !== 'long6' && code.length !== 5) || (codeType === 'long6' && code.length !== 6)) {
      setError('正しい桁数の決済コードを入力してください');
      return;
    }

    setCodeVerifying(true);
    setError('');
    setActiveCodeType(codeType);

    try {
      let data = null;
      let codeError = null;
      let paymentData = null;

      // コードタイプに応じて適切なテーブルから検索
      if (codeType === 'cash5') {
        // 現金用5桁コード: cash_payment_codesテーブルから検索
        const cashResult = await supabase
          .from('cash_payment_codes')
          .select('*')
          .eq('code', code)
          .gt('expires_at', new Date().toISOString())
          .is('used_at', null)
          .single();
        
        if (cashResult.data) {
          data = cashResult.data;
          // cash_payment_codesにはpayment_dataがないので、payment_codesから取得を試みる
          const paymentResult = await supabase
            .from('payment_codes')
            .select('*, payment_data')
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();
          
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
            .single();
          
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
          .single();
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
          .single();
        
        if (remoteResult.data) {
          data = remoteResult.data;
          // remote_invoice_codesにはpayment_dataがないので、payment_codesから取得を試みる
          const paymentResult = await supabase
            .from('payment_codes')
            .select('*, payment_data')
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();
          
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
        setError('無効な決済コードです。コードを確認してください。');
        setCodeVerifying(false);
        return;
      }

      const paymentInfo: PaymentData = {
        store_id: paymentData.storeId || data.store_id,
        store_name: paymentData.storeName,
        amount: paymentData.totalAmount,
        points_to_use: paymentData.pointsUsed || 0,
        items: paymentData.items || []
      };

      setScannedData(paymentInfo);
      setPaymentCodeData({ ...data, payment_data: paymentData });
      setCodeVerifying(false);
    } catch (err) {
      setError('決済コードの検証中にエラーが発生しました');
      setCodeVerifying(false);
    }
  };

  // 現金決済処理
  const handleCashPayment = async () => {
    if (!scannedData || !paymentCodeData || !activeCodeType) return;
    
    setProcessing(true);
    setError('');

    try {
      const paymentData = paymentCodeData.payment_data as any;
      const totalAmount = scannedData.amount;
      const feeAmount = Math.round(totalAmount * 0.03);
      
      // 使用したコードを取得
      const usedCode = activeCodeType === 'cash5' ? cashCode5 : 
                       activeCodeType === 'credit5' ? creditCode5 : 
                       longDistanceCode6;

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
      setActiveCodeType(null);
      setCashCode5('');
      setCreditCode5('');
      setLongDistanceCode6('');
      
    } catch (err) {
      setError('現金決済処理中にエラーが発生しました');
    } finally {
      setProcessing(false);
    }
  };

  // クレジット決済処理
  const handleCreditPayment = async () => {
    if (!scannedData) return;
    
    setProcessing(true);
    setError('');

    try {
      const result = await CustomerStripeService.processPayment(scannedData);
      
      if (!result.success) {
        setError(result.error || '決済処理に失敗しました');
      }
    } catch (err) {
      setError('決済処理中にエラーが発生しました');
    } finally {
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

                {/* 3種類の決済コード入力フィールド（縦並び） */}
                <div className="space-y-4 max-w-md mx-auto">
                  {/* 現金用5桁コード */}
                  <div>
                    <label className="block text-sm mb-2 text-left" style={{ color: '#2D2A26', fontWeight: 600 }}>
                      現金用5桁コード
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={5}
                        value={cashCode5}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 5) {
                            setCashCode5(value);
                            setError('');
                          }
                        }}
                        placeholder="00000"
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
                        onClick={() => verifyPaymentCode(cashCode5, 'cash5')}
                        disabled={codeVerifying || cashCode5.length !== 5}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-sm text-xs sm:text-sm tracking-wide transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
                        style={{ 
                          backgroundColor: '#5C6B4A',
                          color: '#FAF8F5'
                        }}
                      >
                        {codeVerifying && activeCodeType === 'cash5' ? '確認中...' : '確認'}
                  </button>
                </div>
                    <p className="text-xs mt-1 text-left" style={{ color: '#3D3A36', fontWeight: 500 }}>
                      店舗決済（5分間有効）
                    </p>
                  </div>

                  {/* クレジット決済用5桁コード */}
                  <div>
                    <label className="block text-sm mb-2 text-left" style={{ color: '#2D2A26', fontWeight: 600 }}>
                      クレジット決済用5桁コード
                    </label>
                    <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                        maxLength={5}
                        value={creditCode5}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 5) {
                            setCreditCode5(value);
                          setError('');
                        }
                      }}
                        placeholder="00000"
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
                        onClick={() => verifyPaymentCode(creditCode5, 'credit5')}
                        disabled={codeVerifying || creditCode5.length !== 5}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-sm text-xs sm:text-sm tracking-wide transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
                        style={{ 
                          backgroundColor: '#5C6B4A',
                          color: '#FAF8F5'
                        }}
                      >
                        {codeVerifying && activeCodeType === 'credit5' ? '確認中...' : '確認'}
                      </button>
                    </div>
                    <p className="text-xs mt-1 text-left" style={{ color: '#3D3A36', fontWeight: 500 }}>
                      店舗決済（5分間有効）
                    </p>
                  </div>
                  
                  {/* 遠距離決済用6桁コード */}
                  <div>
                    <label className="block text-sm mb-2 text-left" style={{ color: '#2D2A26', fontWeight: 600 }}>
                      遠距離決済用6桁コード
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={longDistanceCode6}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 6) {
                            setLongDistanceCode6(value);
                            setError('');
                          }
                        }}
                        placeholder="000000"
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
                        onClick={() => verifyPaymentCode(longDistanceCode6, 'long6')}
                        disabled={codeVerifying || longDistanceCode6.length !== 6}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-sm text-xs sm:text-sm tracking-wide transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
                        style={{ 
                          backgroundColor: '#5C6B4A',
                          color: '#FAF8F5'
                        }}
                      >
                        {codeVerifying && activeCodeType === 'long6' ? '確認中...' : '確認'}
                        </button>
                    </div>
                    <p className="text-xs mt-1 text-left" style={{ color: '#3D3A36', fontWeight: 500 }}>
                      遠距離決済（1ヶ月間有効）
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
                  <div className="flex justify-between">
                    <span style={{ color: '#2D2A26', fontWeight: 500 }}>決済金額</span>
                    <span 
                      className="text-lg"
                      style={{ 
                        fontFamily: "'Cormorant Garamond', serif",
                        color: '#5C6B4A',
                        fontWeight: 600
                      }}
                    >
                      ¥{scannedData.amount.toLocaleString()}
                    </span>
                  </div>
                  {scannedData.points_to_use > 0 && (
                  <div className="flex justify-between">
                      <span style={{ color: '#2D2A26', fontWeight: 500 }}>使用ポイント</span>
                      <span style={{ color: '#C4856C' }}>-{scannedData.points_to_use} pt</span>
                  </div>
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
                      ¥{Math.max(0, scannedData.amount - scannedData.points_to_use).toLocaleString()}
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
                      const usedCode = activeCodeType === 'cash5' ? cashCode5 : 
                                       activeCodeType === 'credit5' ? creditCode5 : 
                                       longDistanceCode6;
                      navigate('/cash-payment', { 
                        state: { 
                          paymentCode: usedCode, 
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
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
                <span className="text-sm" style={{ color: '#DC2626' }}>{error}</span>
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
