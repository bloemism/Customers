import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paymentCode = searchParams.get('payment_code');
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!sessionId || !paymentCode) {
        setLoading(false);
        return;
      }

      try {
        // payment_transactionsから決済情報を取得
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('*, stores(name)')
          .eq('payment_code', paymentCode)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('決済情報取得エラー:', error);
        } else {
          // payment_codesから品目情報を取得
          let items = [];
          let subtotal = 0;
          let tax = 0;
          let pointsEarned = 0;
          
          if (paymentCode.length === 5) {
            const { data: codeData } = await supabase
              .from('payment_codes')
              .select('payment_data')
              .eq('code', paymentCode)
              .single();
            
            if (codeData?.payment_data) {
              items = codeData.payment_data.items || [];
              subtotal = codeData.payment_data.subtotal || 0;
              tax = codeData.payment_data.tax || 0;
              pointsEarned = codeData.payment_data.pointsEarned || 0;
            }
          }
          
          setPaymentInfo({
            ...data,
            items: items,
            subtotal: subtotal,
            tax: tax,
            points_earned: pointsEarned
          });
        }
      } catch (err) {
        console.error('決済情報取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [sessionId, paymentCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            決済が完了しました
          </h1>
          <p className="text-gray-600 mb-6">
            ご利用ありがとうございました
          </p>

          {paymentInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">会計内容</h3>
              
              {/* 品目一覧テーブル */}
              {paymentInfo.items && paymentInfo.items.length > 0 && (
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
                      {paymentInfo.items.map((item: any, index: number) => {
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
                <div className="flex justify-between">
                  <span className="text-gray-600">店舗名:</span>
                  <span className="font-medium">
                    {paymentInfo.stores?.name || '不明'}
                  </span>
                </div>
                
                {/* 小計（消費税前） */}
                <div className="flex justify-between">
                  <span className="text-gray-600">小計:</span>
                  <span className="font-medium text-gray-900">
                    ¥{(paymentInfo.subtotal || 0).toLocaleString()}
                  </span>
                </div>
                
                {/* 消費税 */}
                <div className="flex justify-between">
                  <span className="text-gray-600">消費税:</span>
                  <span className="font-medium text-gray-900">
                    ¥{(paymentInfo.tax || 0).toLocaleString()}
                  </span>
                </div>
                
                {/* 合計金額（消費税込） */}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600 font-medium">合計金額:</span>
                  <span className="font-medium text-lg text-gray-900">
                    ¥{((paymentInfo.subtotal || 0) + (paymentInfo.tax || 0)).toLocaleString()}
                  </span>
                </div>
                
                {/* ポイント使用 */}
                <div className="flex justify-between">
                  <span className="text-gray-600">ポイント使用:</span>
                  <span className="font-medium text-blue-600">
                    {paymentInfo.metadata?.points_used || 0} pt
                  </span>
                </div>
                
                {/* 引後金額（ポイント差し引き後） */}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600 font-medium">引後金額:</span>
                  <span className="font-medium text-lg text-green-600">
                    ¥{paymentInfo.amount?.toLocaleString() || '0'}
                  </span>
                </div>
                
                {/* 獲得ポイント（引後金額の5%） */}
                <div className="flex justify-between">
                  <span className="text-gray-600">獲得ポイント（5%）:</span>
                  <span className="font-medium text-purple-600">
                    {paymentInfo.points_earned || Math.floor((paymentInfo.amount || 0) * 0.05)} pt
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 italic">
                  ※ 引後金額の5%が付与されます
                </div>
                
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600">決済コード:</span>
                  <span className="font-medium">{paymentCode}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">店舗への送金:</span>
                  <span className="font-medium text-blue-600">
                    ¥{paymentInfo.store_amount?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/customer-menu')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            メニューに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

