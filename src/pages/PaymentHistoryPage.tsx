import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { ArrowLeft, Receipt, Calendar, CreditCard } from 'lucide-react';
import type { CustomerPayment, PaymentItem } from '../types/customer';

const PaymentHistoryPage: React.FC = () => {
  const { customer, getPaymentHistory, loading: contextLoading } = useCustomer();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contextLoading) return;
    const fetchPayments = async () => {
      try {
        if (customer && (customer.id || customer.user_id)) {
          const data = await getPaymentHistory();
          setPayments(data);
        } else {
          setPayments([]);
        }
      } catch (error) {
        console.error('決済履歴の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [customer, getPaymentHistory, contextLoading]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#E8EDE4', color: '#5C6B4A', text: '完了' };
      case 'pending':
        return { bg: '#FEF3C7', color: '#92400E', text: '処理中' };
      case 'failed':
        return { bg: '#FEE2E2', color: '#DC2626', text: '失敗' };
      default:
        return { bg: '#F5F0E8', color: '#8A857E', text: '不明' };
    }
  };

  if (contextLoading || loading) {
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
          <p className="mt-4 text-sm" style={{ color: '#8A857E' }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  const paymentsThisMonth = payments.filter((p) => {
    if (!p.created_at) return false;
    const d = new Date(p.created_at);
    return d.getFullYear() === thisYear && d.getMonth() === thisMonth && p.status === 'completed';
  });

  const monthlyEarned = paymentsThisMonth.reduce(
    (sum, p) => sum + (p.points_earned ?? Math.floor(p.amount * 0.05)),
    0
  );
  const monthlyUsed = paymentsThisMonth.reduce((sum, p) => sum + (p.points_used || 0), 0);

  const currentPoints = customer?.points ?? 0;

  const renderItem = (item: PaymentItem) => {
    const name = item.name ?? item.item_name ?? '商品';
    const unitPrice = item.unit_price ?? item.price ?? 0;
    const qty = item.quantity ?? 1;
    const amount = item.amount ?? unitPrice * qty;
    return (
      <div
        key={name + String(unitPrice) + String(qty)}
        className="flex justify-between items-start py-2 border-b border-[#E0D6C8] last:border-0 text-sm"
      >
        <div>
          <span style={{ color: '#2D2A26' }}>🛍 {name}</span>
          <span className="ml-2" style={{ color: '#8A857E' }}>
            単価 ¥{unitPrice.toLocaleString()} / 本数 {qty}
          </span>
        </div>
        <span style={{ color: '#2D2A26', fontWeight: 500 }}>¥{amount.toLocaleString()}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/customer-menu')}
            className="flex items-center gap-2 text-sm transition-all duration-300 mb-6"
            style={{ color: '#5A5651' }}
          >
            <ArrowLeft className="w-4 h-4" />
            メニューへ戻る
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Receipt className="w-6 h-6" style={{ color: '#5C6B4A' }} />
            <h1
              className="text-2xl"
              style={{
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26'
              }}
            >
              決済履歴
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#8A857E' }}>
            過去の決済履歴・商品明細・ポイント
          </p>
        </div>

        {/* ポイント残高（全ての会計が終了した残ポイント） */}
        <div
          className="mb-6 p-5 rounded-sm"
          style={{
            background: 'linear-gradient(135deg, #E8EDE4 0%, #D4DDCE 100%)',
            border: '1px solid #5C6B4A'
          }}
        >
          <p className="text-xs tracking-[0.1em] mb-1" style={{ color: '#5C6B4A' }}>
            現在のポイント残高
          </p>
          <p
            className="text-3xl"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#2D2A26',
              fontWeight: 700
            }}
          >
            {currentPoints.toLocaleString()} pt
          </p>
          <p className="text-xs mt-1" style={{ color: '#8A857E' }}>
            決済の5%が貯まり、使用した分を引いた残高です
          </p>
        </div>

        {/* 今月のポイントサマリー */}
        <div
          className="grid grid-cols-2 gap-4 mb-8 p-5 rounded-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div>
            <p className="text-xs tracking-[0.1em] mb-1" style={{ color: '#8A857E' }}>
              {thisYear}年{thisMonth + 1}月 獲得
            </p>
            <p className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#5C6B4A', fontWeight: 600 }}>
              +{monthlyEarned} pt
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.1em] mb-1" style={{ color: '#8A857E' }}>
              {thisYear}年{thisMonth + 1}月 使用
            </p>
            <p className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#C4856C', fontWeight: 600 }}>
              -{monthlyUsed} pt
            </p>
          </div>
        </div>

        {/* 決済履歴リスト（商品明細は常に表示） */}
        <div
          className="rounded-sm overflow-hidden"
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: '#E0D6C8' }}>
            <p className="text-xs tracking-[0.2em]" style={{ color: '#8A857E' }}>
              PAYMENT HISTORY
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#F5F0E8' }}
              >
                <Receipt className="w-8 h-8" style={{ color: '#8A857E' }} />
              </div>
              <p style={{ color: '#5A5651' }}>まだ決済履歴がありません</p>
              <p className="text-sm mt-2" style={{ color: '#8A857E' }}>
                店舗で決済を行うと履歴が表示されます
              </p>
            </div>
          ) : (
            <div>
              {payments.map((payment, index) => {
                const statusStyle = getStatusStyle(payment.status);
                const items = payment.payment_data?.items ?? [];
                const subtotal = payment.payment_data?.subtotal ?? payment.amount;
                const tax = payment.payment_data?.tax;
                const pointsUsed = payment.points_used || 0;
                const pointsEarned = payment.points_earned ?? Math.floor(payment.amount * 0.05);

                return (
                  <div
                    key={payment.id ?? index}
                    className="p-6 transition-colors hover:bg-[#FDFCFA]"
                    style={{
                      borderBottom: index < payments.length - 1 ? '1px solid #E0D6C8' : 'none'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#F5F0E8' }}
                        >
                          <CreditCard className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#2D2A26' }}>
                            {payment.payment_data?.store_name ?? `店舗ID: ${payment.store_id}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3" style={{ color: '#8A857E' }} />
                            <span className="text-xs" style={{ color: '#8A857E' }}>
                              {payment.created_at && formatDate(payment.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className="px-3 py-1 rounded-sm text-xs"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color
                        }}
                      >
                        {statusStyle.text}
                      </span>
                    </div>

                    {/* 商品明細（常に表示） */}
                    {items.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-[#E8EDE4] space-y-1">
                        {items.map((item, i) => renderItem(item))}
                        <div className="pt-2 mt-2 text-xs space-y-1" style={{ color: '#8A857E' }}>
                          {payment.payment_data?.subtotal != null && (
                            <p>小計 ¥{(payment.payment_data.subtotal as number).toLocaleString()}</p>
                          )}
                          {tax != null && <p>消費税 ¥{Number(tax).toLocaleString()}</p>}
                          {pointsUsed > 0 && <p>ポイント使用 -¥{pointsUsed.toLocaleString()}</p>}
                          <p style={{ color: '#2D2A26', fontWeight: 600 }}>
                            決済金額 ¥{payment.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {items.length === 0 && (
                      <div className="mt-3 text-xs" style={{ color: '#8A857E' }}>
                        <p>小計 ¥{subtotal.toLocaleString()}</p>
                        {pointsUsed > 0 && <p>ポイント使用 -¥{pointsUsed.toLocaleString()}</p>}
                        <p style={{ color: '#2D2A26', fontWeight: 500 }}>
                          決済金額 ¥{payment.amount.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div
                      className="flex justify-between items-center pt-3 mt-3"
                      style={{ borderTop: '1px solid #F5F0E8' }}
                    >
                      <span className="text-xs" style={{ color: '#8A857E' }}>
                        {payment.payment_method} / 使用: {payment.points_used} pt / +{pointsEarned} pt 獲得
                      </span>
                      <p className="text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#3D4A35', fontWeight: 600 }}>
                        ¥{payment.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="mt-8 rounded-sm p-6"
          style={{
            backgroundColor: 'rgba(245,240,232,0.7)',
            border: '1px solid #E0D6C8'
          }}
        >
          <p className="text-xs tracking-[0.2em] mb-4" style={{ color: '#8A857E' }}>
            PAYMENT SYSTEM
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm mb-2" style={{ color: '#5C6B4A', fontWeight: 500 }}>
                決済方法
              </p>
              <ul className="text-sm space-y-1" style={{ color: '#5A5651' }}>
                <li>• クレジットカード決済</li>
                <li>• 店舗QRコード読み取り</li>
                <li>• セキュアな決済処理</li>
              </ul>
            </div>
            <div>
              <p className="text-sm mb-2" style={{ color: '#5C6B4A', fontWeight: 500 }}>
                ポイント付与
              </p>
              <ul className="text-sm space-y-1" style={{ color: '#5A5651' }}>
                <li>• 決済金額の5%がポイント付与</li>
                <li>• 即座に反映されます</li>
                <li>• 全国加盟店舗で利用可能</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
