import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { QrCode, ArrowLeft, Copy, Check, Star } from 'lucide-react';

// 背景画像
const BG_IMAGE = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

const levelConfig = {
  BASIC: {
    name: 'ベーシック',
    color: '#8A857E',
    bgColor: '#F5F0E8',
    minPoints: 0,
    maxPoints: 99
  },
  REGULAR: {
    name: 'レギュラー',
    color: '#5C6B4A',
    bgColor: '#E8EDE4',
    minPoints: 100,
    maxPoints: 499
  },
  PRO: {
    name: 'プロ',
    color: '#C4856C',
    bgColor: '#F5EBE6',
    minPoints: 500,
    maxPoints: 999
  },
  EXPERT: {
    name: 'エキスパート',
    color: '#3D4A35',
    bgColor: '#E0D6C8',
    minPoints: 1000,
    maxPoints: 9999
  }
};

const CustomerQRCode: React.FC = () => {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const [copiedTarget, setCopiedTarget] = useState<'code' | 'id' | null>(null);

  const getLevelInfo = (level: string) => levelConfig[level as keyof typeof levelConfig] || levelConfig.BASIC;

  const copyToClipboard = async (text: string, target: 'code' | 'id') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(target);
      setTimeout(() => setCopiedTarget(null), 1800);
    } catch (error) {
      console.error('コピーに失敗しました:', error);
    }
  };

  const defaultCustomer = customer
    ? { ...customer, customer_code: (customer as any)?.customer_code || undefined }
    : {
        id: 'guest-12345',
        user_id: '',
        name: 'ゲストユーザー',
        email: 'guest@example.com',
        phone: '',
        customer_code: undefined,
        points: 0,
        level: 'BASIC' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

  const customerCode = defaultCustomer.customer_code || (customer as any)?.customer_code;
  const levelInfo = getLevelInfo(defaultCustomer.level);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 無地背景 */}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/customer-menu')}
            className="flex items-center gap-2 text-sm transition-all duration-300"
            style={{ color: '#5A5651' }}
          >
            <ArrowLeft className="w-4 h-4" />
            メニューへ戻る
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg" style={{ color: '#5C6B4A' }}>✿</span>
            <span 
              className="text-sm tracking-wide"
              style={{ color: '#3D4A35' }}
            >
              87app
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          {/* 顧客コードカード */}
          <section 
            className="rounded-sm p-6 md:p-8"
            style={{ 
              backgroundColor: 'rgba(92,107,74,0.95)',
              color: '#FAF8F5'
            }}
          >
            <div className="space-y-6">
              <div>
                <p 
                  className="text-xs tracking-[0.3em] mb-3"
                  style={{ color: 'rgba(250,248,245,0.6)' }}
                >
                  CUSTOMER CODE
                </p>
                <h2 
                  className="text-2xl mb-2"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif"
                  }}
                >
                  マイ会員コード
                </h2>
                <p 
                  className="text-sm"
                  style={{ color: 'rgba(250,248,245,0.75)' }}
                >
                  店舗でスキャンすると、ポイントや決済がスムーズに進みます。
                </p>
              </div>

              {customerCode ? (
                <div 
                  className="rounded-sm p-6"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)'
                  }}
                >
                  <div className="text-center">
                    <div 
                      className="text-3xl md:text-4xl font-mono tracking-widest break-all mb-2"
                      style={{ 
                        fontFamily: "'Cormorant Garamond', serif",
                        color: '#3D4A35',
                        fontWeight: 600
                      }}
                    >
                      {String(customerCode)}
                    </div>
                    <p 
                      className="text-xs tracking-[0.2em]"
                      style={{ color: '#8A857E' }}
                    >
                      YOUR PERSONAL CODE
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(String(customerCode), 'code')}
                    className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm text-sm transition-all duration-300"
                    style={{ 
                      backgroundColor: '#F5F0E8',
                      color: '#5C6B4A'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#E0D6C8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#F5F0E8';
                    }}
                  >
                    {copiedTarget === 'code' ? (
                      <>
                        <Check className="w-4 h-4" />
                        コピーしました
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        コードをコピー
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div 
                  className="rounded-sm p-6 text-sm"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.15)'
                  }}
                >
                  顧客コードが未設定です。マイプロフィールの登録を完了すると表示されます。
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div 
                  className="rounded-sm p-4"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}
                >
                  <p 
                    className="text-xs tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(250,248,245,0.6)' }}
                  >
                    POINTS
                  </p>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5" style={{ color: '#C4856C' }} />
                    <span 
                      className="text-3xl"
                      style={{ 
                        fontFamily: "'Cormorant Garamond', serif",
                        fontWeight: 600
                      }}
                    >
                      {defaultCustomer.points}
                    </span>
                  </div>
                </div>
                <div 
                  className="rounded-sm p-4"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}
                >
                  <p 
                    className="text-xs tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(250,248,245,0.6)' }}
                  >
                    LEVEL
                  </p>
                  <p className="text-lg font-medium">{levelInfo.name}</p>
                  <p 
                    className="text-xs"
                    style={{ color: 'rgba(250,248,245,0.6)' }}
                  >
                    {levelInfo.minPoints}-{levelInfo.maxPoints} pt
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* サイドパネル */}
          <section className="space-y-4">
            <div 
              className="rounded-sm p-5"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: '1px solid #E0D6C8'
              }}
            >
              <p 
                className="text-xs tracking-[0.2em] mb-4"
                style={{ color: '#8A857E' }}
              >
                PROFILE SUMMARY
              </p>
              <div className="space-y-4">
                <div>
                  <p 
                    className="text-xs tracking-[0.15em] mb-1"
                    style={{ color: '#8A857E' }}
                  >
                    NAME
                  </p>
                  <p 
                    className="text-lg"
                    style={{ 
                      fontFamily: "'Noto Serif JP', serif",
                      color: '#2D2A26'
                    }}
                  >
                    {defaultCustomer.name}
                  </p>
                </div>
                <div>
                  <p 
                    className="text-xs tracking-[0.15em] mb-1"
                    style={{ color: '#8A857E' }}
                  >
                    EMAIL
                  </p>
                  <p 
                    className="text-sm break-words"
                    style={{ color: '#5A5651' }}
                  >
                    {defaultCustomer.email}
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="rounded-sm p-5"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: '1px solid #E0D6C8'
              }}
            >
              <p 
                className="text-xs tracking-[0.2em] mb-4"
                style={{ color: '#8A857E' }}
              >
                ID / CODE
              </p>
              <div className="space-y-3">
                {customerCode && (
                  <div 
                    className="flex items-center gap-2 rounded-sm px-3 py-2"
                    style={{ 
                      backgroundColor: '#F5F0E8',
                      border: '1px solid #E0D6C8'
                    }}
                  >
                    <QrCode className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                    <code 
                      className="flex-1 font-mono text-sm break-all"
                      style={{ color: '#3D4A35' }}
                    >
                      {String(customerCode)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(String(customerCode), 'code')}
                      className="p-2 rounded-sm transition-colors"
                      style={{ color: '#5C6B4A' }}
                    >
                      {copiedTarget === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                <div 
                  className="flex items-center gap-2 rounded-sm px-3 py-2"
                  style={{ 
                    backgroundColor: '#FDFCFA',
                    border: '1px solid #E0D6C8'
                  }}
                >
                  <span 
                    className="text-xs tracking-[0.15em]"
                    style={{ color: '#8A857E' }}
                  >
                    ID
                  </span>
                  <code 
                    className="flex-1 font-mono text-xs break-all"
                    style={{ color: '#5A5651' }}
                  >
                    {defaultCustomer.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(defaultCustomer.id, 'id')}
                    className="p-2 rounded-sm transition-colors"
                    style={{ color: '#8A857E' }}
                  >
                    {copiedTarget === 'id' ? <Check className="w-4 h-4" style={{ color: '#5C6B4A' }} /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {!customer && (
              <div 
                className="rounded-sm p-5 text-sm"
                style={{ 
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  color: '#92400E'
                }}
              >
                <p className="font-medium mb-2">顧客データを登録すると、より多くの機能をご利用いただけます。</p>
                <button
                  onClick={() => navigate('/customer-data-registration')}
                  className="underline transition-colors hover:no-underline"
                  style={{ color: '#78350F' }}
                >
                  顧客データを登録する →
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CustomerQRCode;
