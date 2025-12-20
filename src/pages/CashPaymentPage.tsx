import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Hash, CreditCard } from 'lucide-react';
import { useCustomer } from '../contexts/CustomerContext';
import { supabase } from '../lib/supabase';

const CashPaymentPage: React.FC = () => {
  console.log('💴 CashPaymentPage コンポーネント開始');
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, loading: customerLoading, error: customerError } = useCustomer();
  
  // location.stateから決済コードとデータを取得
  const [paymentCode, setPaymentCode] = useState(location.state?.paymentCode || '');
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [scannedData, setScannedData] = useState<any>(location.state?.scannedData || null);
  const [paymentCodeData, setPaymentCodeData] = useState<any>(location.state?.paymentCodeData || null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'stripe'>('cash');
  const [stripeProcessing, setStripeProcessing] = useState(false);

  // location.stateからデータが渡された場合、自動的に検証済み状態にする
  useEffect(() => {
    if (location.state?.scannedData && location.state?.paymentCodeData) {
      console.log('💴 CashPaymentPage - location.stateからデータを取得:', {
        paymentCode: location.state.paymentCode,
        hasScannedData: !!location.state.scannedData,
        hasPaymentCodeData: !!location.state.paymentCodeData
      });
      
      const paymentCodeData = location.state.paymentCodeData;
      const paymentData = paymentCodeData.payment_data || {};
      
      // payment_dataからsubtotal、tax、totalAmountを取得
      const subtotal = paymentData.subtotal 
        ? (typeof paymentData.subtotal === 'string' ? parseInt(paymentData.subtotal, 10) : Number(paymentData.subtotal))
        : 0;
      
      const tax = paymentData.tax 
        ? (typeof paymentData.tax === 'string' ? parseInt(paymentData.tax, 10) : Number(paymentData.tax))
        : 0;
      
      const totalAmount = paymentData.totalAmount 
        ? (typeof paymentData.totalAmount === 'string' ? parseInt(paymentData.totalAmount, 10) : Number(paymentData.totalAmount))
        : 0;
      
      console.log('💴 CashPaymentPage - location.stateからpayment_data取得:', {
        paymentData,
        subtotal,
        tax,
        totalAmount
      });
      
      // scannedDataを更新（subtotal、tax、totalAmountを含める）
      const updatedScannedData = {
        ...location.state.scannedData,
        subtotal: subtotal,
        tax: tax,
        amount: totalAmount || location.state.scannedData.amount
      };
      
      setPaymentCode(location.state.paymentCode || '');
      setScannedData(updatedScannedData);
      setPaymentCodeData(paymentCodeData);
    }
  }, [location.state]);

  // 決済コード検証
  const verifyPaymentCode = async () => {
    console.log('💴 CashPaymentPage - 決済コード取得開始:', paymentCode);
    
    if (!paymentCode || (paymentCode.length !== 5 && paymentCode.length !== 6)) {
      setError('5桁または6桁の決済コードを入力してください');
      return;
    }

    setCodeVerifying(true);
    setError('');

    try {
      let data = null;
      let codeError = null;

      // 5桁の場合はpayment_codes、6桁の場合はremote_invoice_codesから検索
      if (paymentCode.length === 5) {
        console.log('💴 CashPaymentPage - 5桁コード検証開始');
        const result = await supabase
          .from('payment_codes')
          .select('*, payment_data')
          .eq('code', paymentCode)
          .gt('expires_at', new Date().toISOString())
          .is('used_at', null)
          .single();
        data = result.data;
        codeError = result.error;
      } else if (paymentCode.length === 6) {
        console.log('💴 CashPaymentPage - 6桁コード検証開始');
        const result = await supabase
          .from('remote_invoice_codes')
          .select('*, payment_data')
          .eq('code', paymentCode)
          .gt('expires_at', new Date().toISOString())
          .is('used_at', null)
          .single();
        data = result.data;
        codeError = result.error;
      }

      if (codeError || !data) {
        console.error('💴 CashPaymentPage - 決済コード検証エラー:', codeError);
        setError('無効な決済コードです。コードを確認してください。');
        setCodeVerifying(false);
        return;
      }

      console.log('💴 CashPaymentPage - 取得した決済データ:', data);

      // 決済データを取得
      const paymentData = data.payment_data as any;
      
      // 決済情報を設定
      // payment_dataからsubtotal、tax、totalAmountを取得
      const items = paymentData.items || [];
      
      // subtotal、tax、totalAmountを数値に変換（文字列の可能性があるため）
      const subtotal = paymentData.subtotal 
        ? (typeof paymentData.subtotal === 'string' ? parseInt(paymentData.subtotal, 10) : Number(paymentData.subtotal))
        : 0;
      
      const tax = paymentData.tax 
        ? (typeof paymentData.tax === 'string' ? parseInt(paymentData.tax, 10) : Number(paymentData.tax))
        : 0;
      
      const totalAmount = paymentData.totalAmount 
        ? (typeof paymentData.totalAmount === 'string' ? parseInt(paymentData.totalAmount, 10) : Number(paymentData.totalAmount))
        : 0;
      
      console.log('💴 CashPaymentPage - payment_data取得:', {
        paymentData,
        subtotal,
        tax,
        totalAmount,
        subtotalType: typeof paymentData.subtotal,
        taxType: typeof paymentData.tax,
        totalAmountType: typeof paymentData.totalAmount,
        subtotalValue: paymentData.subtotal,
        taxValue: paymentData.tax,
        totalAmountValue: paymentData.totalAmount
      });
      
      const paymentInfo = {
        store_id: paymentData.storeId,
        store_name: paymentData.storeName,
        amount: totalAmount,
        subtotal: subtotal,
        tax: tax,
        points_to_use: paymentData.pointsUsed || 0,
        points_earned: paymentData.pointsEarned || 0,
        items: items
      };
      
      console.log('💴 CashPaymentPage - paymentInfo設定:', paymentInfo);
      
      console.log('💴 CashPaymentPage - paymentInfo設定:', paymentInfo);

      setScannedData(paymentInfo);
      setPaymentCodeData(data);
      console.log('💴 CashPaymentPage - 決済データ設定完了');
      
      setCodeVerifying(false);
    } catch (err) {
      console.error('決済コード検証エラー:', err);
      setError('決済コードの検証中にエラーが発生しました');
      setCodeVerifying(false);
    }
  };

  // Stripe Connect決済処理（Checkout Sessionにリダイレクト）
  const handleStripePayment = async () => {
    if (!scannedData || !paymentCodeData || !customer) return;
    
    setStripeProcessing(true);
    setError('');

    try {
      // 1. 決済コードからStripe Connect Checkout Sessionを作成
      // ローカル開発環境ではViteのプロキシを使用、本番環境では相対パスを使用
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      
      const response = await fetch(`${API_BASE_URL}/api/process-payment-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentCode: paymentCode,
          customerId: customer.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '決済の作成に失敗しました');
      }

      console.log('Stripe Connect Checkout Session作成成功:', data);

      // 2. Stripe Checkoutページにリダイレクト
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Checkout URLが取得できませんでした');
      }

    } catch (err) {
      console.error('Stripe決済エラー:', err);
      setError(err instanceof Error ? err.message : 'Stripe決済処理中にエラーが発生しました');
      setStripeProcessing(false);
    }
  };

  // 現金決済処理（顧客アプリと店舗アプリの両方に反映）
  const handleCashPayment = async () => {
    if (!scannedData || !paymentCodeData || !customer) return;
    
    setProcessing(true);
    setError('');

    try {
      const paymentData = paymentCodeData.payment_data as any;
      const storeId = paymentData.storeId || paymentCodeData.store_id;
      const customerId = customer.id; // customersテーブルのid（UUID）
      const userId = customer.user_id?.toString() || customer.id?.toString(); // customer_paymentsテーブル用のuser_id（text）
      
      // 決済金額とポイント計算
      const pointsUsed = Math.abs(paymentData.pointsUsed || scannedData.points_to_use || 0);
      const finalAmount = scannedData.amount; // ポイント差し引き後の金額（税込）
      const pointsEarned = Math.floor(finalAmount * 0.05); // 5%のポイント付与

      console.log('💴 CashPaymentPage - 現金決済記録開始:', {
        payment_code: paymentCode,
        store_id: storeId,
        customer_id: customerId,
        user_id: userId,
        final_amount: finalAmount,
        points_used: pointsUsed,
        points_earned: pointsEarned
      });

      // 1. 顧客の現在のポイントを取得
      const { data: customerData, error: fetchError } = await supabase
        .from('customers')
        .select('points')
        .eq('id', customerId)
        .single();

      if (fetchError) {
        console.error('顧客データ取得エラー:', fetchError);
        setError('顧客データの取得に失敗しました');
        setProcessing(false);
        return;
      }

      const currentPoints = customerData?.points || 0;
      const newPoints = currentPoints + pointsEarned - pointsUsed;

      // 2. 顧客データを更新（ポイント付与と使用）
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) {
        console.error('顧客データ更新エラー:', updateError);
        setError('顧客データの更新に失敗しました');
        setProcessing(false);
        return;
      }

      console.log('顧客データ更新成功:', { customerId, newPoints });

      // 3. 決済履歴を記録（customer_payments）- 顧客アプリ用
      const { error: historyError } = await supabase
        .from('customer_payments')
        .insert([
          {
            user_id: userId,
            store_id: storeId,
            amount: finalAmount,
            points_earned: pointsEarned,
            points_spent: pointsUsed,
            payment_method: 'cash',
            status: 'completed',
            payment_date: new Date().toISOString(),
            payment_code: paymentCode,
            payment_data: {
              items: paymentData.items || [],
              subtotal: paymentData.subtotal || 0,
              tax: paymentData.tax || 0,
              totalAmount: paymentData.totalAmount || finalAmount,
              storeName: paymentData.storeName,
              paymentCode: paymentCode
            },
            created_at: new Date().toISOString()
          }
        ]);

      if (historyError) {
        console.error('決済履歴記録エラー:', historyError);
        // エラーを記録するが、処理は続行
      } else {
        console.log('決済履歴記録成功');
      }

      // 4. 店舗アプリ用の購入履歴を記録（purchases + purchase_items）
      if (paymentData.items && paymentData.items.length > 0) {
        // purchasesテーブルに記録
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .insert([
            {
              customer_id: customerId,
              store_id: storeId,
              purchase_date: new Date().toISOString(),
              total_amount: paymentData.subtotal || 0,
              tax_amount: paymentData.tax || 0,
              points_earned: pointsEarned,
              points_used: pointsUsed,
              payment_method: 'cash',
              qr_code_data: {
                payment_code: paymentCode,
                payment_data: paymentData
              },
              notes: `現金決済 - 決済コード: ${paymentCode}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (purchaseError) {
          console.error('purchases記録エラー:', purchaseError);
        } else if (purchaseData) {
          console.log('purchases記録成功:', purchaseData.id);
          
          // purchase_itemsテーブルに品目を記録
          const purchaseItems = paymentData.items.map((item: any) => {
            // nameから品目名と色名を抽出（例: "カーネーション (白)"）
            const nameMatch = item.name?.match(/^(.+?)\s*\((.+?)\)$/);
            const itemName = nameMatch ? nameMatch[1] : item.name || '不明';
            const colorName = nameMatch ? nameMatch[2] : '-';
            
            return {
              purchase_id: purchaseData.id,
              item_name: `${itemName} (${colorName})`,
              unit_price: item.price || 0,
              quantity: item.quantity || 1,
              total_price: item.total || (item.price * item.quantity) || 0,
              created_at: new Date().toISOString()
            };
          });

          const { error: itemsError } = await supabase
            .from('purchase_items')
            .insert(purchaseItems);

          if (itemsError) {
            console.error('purchase_items記録エラー:', itemsError);
          } else {
            console.log('purchase_items記録成功:', purchaseItems.length, '件');
          }
        }
      }

      // 5. ポイント履歴を記録（付与）- 顧客アプリ用
      if (pointsEarned > 0) {
        const { error: pointError } = await supabase
          .from('point_history')
          .insert([
            {
              user_id: userId,
              store_id: storeId,
              points_change: pointsEarned,
              transaction_type: 'earned',
              description: `現金決済完了 - ${paymentData.storeName || '不明な店舗'} (決済コード: ${paymentCode})${paymentData?.items ? ` - ${paymentData.items.length}品目` : ''}`,
              created_at: new Date().toISOString()
            }
          ]);

        if (pointError) {
          console.error('ポイント履歴記録エラー（付与）:', pointError);
        } else {
          console.log('ポイント履歴記録成功（付与）:', pointsEarned);
        }
      }

      // 6. ポイント使用履歴を記録 - 顧客アプリ用
      if (pointsUsed > 0) {
        const { error: pointUsedError } = await supabase
          .from('point_history')
          .insert([
            {
              user_id: userId,
              store_id: storeId,
              points_change: -pointsUsed,
              transaction_type: 'spent',
              description: `現金決済時のポイント使用 - ${paymentData.storeName || '不明な店舗'} (決済コード: ${paymentCode})${paymentData?.items ? ` - ${paymentData.items.length}品目` : ''}`,
              created_at: new Date().toISOString()
            }
          ]);

        if (pointUsedError) {
          console.error('ポイント使用履歴記録エラー:', pointUsedError);
        } else {
          console.log('ポイント使用履歴記録成功:', pointsUsed);
        }
      }

      // 7. 決済コードを使用済みにマーク
      if (paymentCode.length === 5) {
        await supabase
          .from('payment_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('code', paymentCode)
          .is('used_at', null);
      } else if (paymentCode.length === 6) {
        await supabase
          .from('remote_invoice_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('code', paymentCode)
          .is('used_at', null);
      }

      console.log('💴 CashPaymentPage - 現金決済記録成功');

      // 成功メッセージ
      alert('現金決済が完了しました。店舗で直接お支払いください。\n\n決済金額: ¥' + finalAmount.toLocaleString() + '\n獲得ポイント: ' + pointsEarned + ' pt');
      
      // ページをリセット
      setScannedData(null);
      setPaymentCodeData(null);
      setPaymentCode('');
      navigate('/customer-menu');
      
    } catch (err) {
      console.error('現金決済エラー:', err);
      setError('現金決済処理中にエラーが発生しました');
    } finally {
      setProcessing(false);
    }
  };

  // エラー表示
  if (customerError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{customerError}</p>
          <button
            onClick={() => navigate('/customer-menu')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  // ローディング中の表示
  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/customer-menu')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">現金決済</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {!scannedData ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-4xl">💴</div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  決済コードを入力してください
                </h2>
                <p className="text-gray-600 mb-4">
                  店舗から伝えられた5桁または6桁の決済コードを入力してください
                </p>
              </div>
              
              <div className="max-w-xs mx-auto mb-4">
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
                  placeholder="5桁または6桁のコード"
                  className="w-full px-4 py-3 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {paymentCode.length === 5 && '基本決済（5分間有効）'}
                  {paymentCode.length === 6 && '遠距離決済（1ヶ月間有効）'}
                  {paymentCode.length > 0 && paymentCode.length !== 5 && paymentCode.length !== 6 && '5桁または6桁のコードを入力してください'}
                </p>
              </div>
              
              <button
                onClick={verifyPaymentCode}
                disabled={codeVerifying || paymentCode.length < 5}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {codeVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    検証中...
                  </>
                ) : (
                  <>
                    <Hash className="h-5 w-5 mr-2" />
                    決済コードを確認
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-4xl">💴</div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  現金決済確認
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  店舗で直接現金でお支払いください
                </p>
              </div>

              {/* 決済情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">会計内容</h3>
                
                {/* 品目一覧テーブル */}
                {scannedData.items && scannedData.items.length > 0 && (
                  <div className="mb-4">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-2 font-medium text-gray-700">品目</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-700">色</th>
                          <th className="text-right py-2 px-2 font-medium text-gray-700">単価</th>
                          <th className="text-right py-2 px-2 font-medium text-gray-700">本数</th>
                          <th className="text-right py-2 px-2 font-medium text-gray-700">商品合計</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scannedData.items.map((item: any, index: number) => {
                          // nameから品目名と色名を抽出（例: "カーネーション (白)"）
                          const nameMatch = item.name?.match(/^(.+?)\s*\((.+?)\)$/);
                          const itemName = nameMatch ? nameMatch[1] : item.name || '不明';
                          const colorName = nameMatch ? nameMatch[2] : '-';
                          const unitPrice = item.price || 0;
                          const quantity = item.quantity || 1;
                          const total = item.total || (unitPrice * quantity) || 0;
                          
                          return (
                            <tr key={index} className="border-b border-gray-200">
                              <td className="py-2 px-2 text-gray-900">{itemName}</td>
                              <td className="py-2 px-2 text-gray-700">{colorName}</td>
                              <td className="py-2 px-2 text-right text-gray-700">¥{unitPrice.toLocaleString()}</td>
                              <td className="py-2 px-2 text-right text-gray-900">{quantity}</td>
                              <td className="py-2 px-2 text-right font-medium text-gray-900">
                                ¥{total.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="space-y-2 text-sm border-t pt-3">
                  {/* 小計（消費税前） */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">小計:</span>
                    <span className="font-medium text-gray-900">
                      ¥{(Number(scannedData.subtotal) || 0).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* ポイント使用 */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">ポイント使用:</span>
                    <span className="font-medium text-blue-600">
                      {Math.abs(scannedData.points_to_use || 0)} pt
                    </span>
                  </div>
                  
                  {/* ポイント引後金額（消費税前） */}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600 font-medium">ポイント引後金額:</span>
                    <span className="font-medium text-lg text-gray-900">
                      ¥{((Number(scannedData.subtotal) || 0) - Math.abs(scannedData.points_to_use || 0)).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* 消費税（ポイント引後金額に対して） */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">消費税:</span>
                    <span className="font-medium text-gray-900">
                      ¥{(Number(scannedData.tax) || 0).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* 合計金額（ポイント引後金額 + 消費税） */}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600 font-medium">合計金額:</span>
                    <span className="font-medium text-lg text-green-600">
                      ¥{scannedData.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* 獲得ポイント（合計金額の5%） */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">獲得ポイント（5%）:</span>
                    <span className="font-medium text-purple-600">
                      {scannedData.points_earned || Math.floor(scannedData.amount * 0.05)} pt
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 italic">
                    ※ 合計金額の5%が付与されます
                  </div>
                </div>
              </div>

              {/* 注意事項 */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">ご注意</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• 店舗で直接現金でお支払いください</li>
                      <li>• 決済情報は記録され、ポイントが付与されます</li>
                      <li>• 売上の3%が手数料として記録されます</li>
                      <li>• 決済完了後、店舗スタッフに確認してください</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 決済方法選択 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">決済方法を選択</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'cash'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">💴</div>
                    <div className="font-medium text-gray-900">現金決済</div>
                    <div className="text-xs text-gray-600 mt-1">店舗で直接支払い</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'stripe'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                    <div className="font-medium text-gray-900">カード決済</div>
                    <div className="text-xs text-gray-600 mt-1">Stripe Connect</div>
                  </button>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setScannedData(null);
                    setPaymentCodeData(null);
                    setPaymentCode('');
                    setError('');
                    setPaymentMethod('cash');
                  }}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  やり直す
                </button>
                {paymentMethod === 'cash' ? (
                  <button
                    onClick={handleCashPayment}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        処理中...
                      </>
                    ) : (
                      <>
                        <div className="text-xl mr-2">💴</div>
                        現金決済を確定
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleStripePayment}
                    disabled={stripeProcessing || !customer}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {stripeProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        決済処理中...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        カード決済を確定
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashPaymentPage;

