import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { ArrowLeft, Receipt, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import type { CustomerPayment } from '../types/customer';

// 背景画像
const BG_IMAGE = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

const PaymentHistoryPage: React.FC = () => {
  const { customer, getPaymentHistory } = useCustomer();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        if (customer && customer.id) {
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
  }, [customer, getPaymentHistory]);

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

  if (loading) {
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

  const totalAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPoints = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.points_earned || Math.floor(p.amount * 0.05)), 0);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 無地背景 */}

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* ヘッダー */}
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
            過去の決済履歴と総決済金額
          </p>
        </div>

        {/* 統計情報 */}
        <div 
          className="grid grid-cols-3 gap-4 mb-8 p-6 rounded-sm"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div className="text-center">
            <p 
              className="text-xs tracking-[0.1em] mb-2"
              style={{ color: '#8A857E' }}
            >
              総決済回数
            </p>
            <p 
              className="text-2xl"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                color: '#3D4A35',
                fontWeight: 600
              }}
            >
              {payments.length}
            </p>
            <p className="text-xs" style={{ color: '#8A857E' }}>回</p>
          </div>
          <div className="text-center">
            <p 
              className="text-xs tracking-[0.1em] mb-2"
              style={{ color: '#8A857E' }}
            >
              総決済金額
            </p>
            <p 
              className="text-2xl"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                color: '#5C6B4A',
                fontWeight: 600
              }}
            >
              ¥{totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p 
              className="text-xs tracking-[0.1em] mb-2"
              style={{ color: '#8A857E' }}
            >
              総獲得ポイント
            </p>
            <p 
              className="text-2xl"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                color: '#C4856C',
                fontWeight: 600
              }}
            >
              {totalPoints}
            </p>
            <p className="text-xs" style={{ color: '#8A857E' }}>pt</p>
          </div>
        </div>

        {/* 決済履歴リスト */}
        <div 
          className="rounded-sm overflow-hidden"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div 
            className="px-6 py-4 border-b"
            style={{ borderColor: '#E0D6C8' }}
          >
            <p 
              className="text-xs tracking-[0.2em]"
              style={{ color: '#8A857E' }}
            >
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
                return (
                  <div 
                    key={index} 
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
                          <p 
                            className="text-sm font-medium"
                            style={{ color: '#2D2A26' }}
                          >
                            店舗ID: {payment.store_id}
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

                    <div 
                      className="flex items-center justify-between pt-3"
                      style={{ borderTop: '1px solid #F5F0E8' }}
                    >
                      <div className="flex items-center gap-4 text-xs" style={{ color: '#8A857E' }}>
                        <span>決済方法: {payment.payment_method}</span>
                        <span>ポイント使用: {payment.points_used} pt</span>
                      </div>
                      <div className="text-right">
                        <p 
                          className="text-lg"
                          style={{ 
                            fontFamily: "'Cormorant Garamond', serif",
                            color: '#3D4A35',
                            fontWeight: 600
                          }}
                        >
                          ¥{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs" style={{ color: '#5C6B4A' }}>
                          +{payment.points_earned || Math.floor(payment.amount * 0.05)} pt
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 説明セクション */}
        <div 
          className="mt-8 rounded-sm p-6"
          style={{ 
            backgroundColor: 'rgba(245,240,232,0.7)',
            border: '1px solid #E0D6C8'
          }}
        >
          <p 
            className="text-xs tracking-[0.2em] mb-4"
            style={{ color: '#8A857E' }}
          >
            PAYMENT SYSTEM
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p 
                className="text-sm mb-2"
                style={{ color: '#5C6B4A', fontWeight: 500 }}
              >
                決済方法
              </p>
              <ul className="text-sm space-y-1" style={{ color: '#5A5651' }}>
                <li>• クレジットカード決済</li>
                <li>• 店舗QRコード読み取り</li>
                <li>• セキュアな決済処理</li>
              </ul>
            </div>
            <div>
              <p 
                className="text-sm mb-2"
                style={{ color: '#5C6B4A', fontWeight: 500 }}
              >
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


