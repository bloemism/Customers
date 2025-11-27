import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { QrCode, User, Mail, Star, ArrowLeft, Copy, Check, Flower } from 'lucide-react';

const levelConfig = {
  BASIC: {
    name: 'ベーシック',
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    minPoints: 0,
    maxPoints: 99
  },
  REGULAR: {
    name: 'レギュラー',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    minPoints: 100,
    maxPoints: 499
  },
  PRO: {
    name: 'プロ',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    minPoints: 500,
    maxPoints: 999
  },
  EXPERT: {
    name: 'エキスパート',
    color: 'from-yellow-400 to-yellow-600',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
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
    <div className="min-h-screen bg-[#f8f5f0] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <button
            onClick={() => navigate('/customer-menu')}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-gray-600 shadow-sm transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            メニューに戻る
          </button>
          <div className="flex items-center gap-2 text-gray-500">
            <Flower className="h-5 w-5 text-[#0fbab9]" />
            <span className="text-sm font-semibold text-gray-700">87app Customers</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <section className="rounded-[32px] bg-[#5c3c2f] p-6 text-white shadow-[0_20px_50px_rgba(42,27,17,0.35)]">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.5em] text-white/60">Customer Code</p>
                <h2 className="mt-3 text-3xl font-semibold">マイ顧客コード</h2>
                <p className="text-sm text-white/75">店舗でスキャンすると、ポイントや決済がスムーズに進みます。</p>
              </div>

              {customerCode ? (
                <div className="rounded-2xl bg-white/95 p-6 text-gray-900 shadow-lg">
                  <div className="text-center">
                    <div className="text-4xl font-mono font-semibold tracking-widest text-[#4a30b5] break-all">
                      {String(customerCode)}
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.4em] text-gray-400">Your personal code</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(String(customerCode), 'code')}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#fbe2fe] to-[#e3f0ff] px-4 py-3 text-sm font-semibold text-[#6a40f3] shadow-inner transition hover:from-[#f9d0ff] hover:to-[#d3e8ff]"
                  >
                    {copiedTarget === 'code' ? (
                      <>
                        <Check className="h-4 w-4" />
                        コピーしました
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        コードをコピー
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/15 p-6 text-sm text-white shadow-inner">
                  顧客コードが未設定です。マイプロフィールの登録を完了すると表示されます。
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/70">Points</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Star className="h-6 w-6 text-yellow-300" />
                    <div className="text-3xl font-semibold">{defaultCustomer.points}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/70">Level</p>
                  <div className="mt-2 text-lg font-semibold">{levelInfo.name}</div>
                  <p className="text-xs text-white/70">
                    {levelInfo.minPoints}-{levelInfo.maxPoints} pt
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_35px_rgba(46,31,22,0.14)]">
              <h3 className="text-sm font-semibold text-gray-900">プロフィールサマリー</h3>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-350">identity</p>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">NAME</p>
                  <p className="mt-1 text-lg font-medium text-gray-900">{defaultCustomer.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">EMAIL</p>
                  <p className="mt-1 break-words text-sm">{defaultCustomer.email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_35px_rgba(46,31,22,0.14)]">
              <h3 className="text-sm font-semibold text-gray-900">顧客 ID / コード</h3>
              <div className="mt-4 space-y-4 text-sm">
                {customerCode && (
                  <div className="flex items-center gap-2 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-2 text-purple-700 shadow-inner">
                    <QrCode className="h-4 w-4 text-purple-500" />
                    <code className="flex-1 font-mono text-sm break-all">{String(customerCode)}</code>
                    <button
                      onClick={() => copyToClipboard(String(customerCode), 'code')}
                      className="rounded-full p-2 text-purple-500 transition hover:bg-white/70"
                    >
                      {copiedTarget === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 shadow-inner">
                  <span className="text-xs font-semibold tracking-[0.3em] text-gray-400">ID</span>
                  <code className="flex-1 font-mono text-xs break-all">{defaultCustomer.id}</code>
                  <button
                    onClick={() => copyToClipboard(defaultCustomer.id, 'id')}
                    className="rounded-full p-2 text-gray-500 transition hover:bg-white"
                  >
                    {copiedTarget === 'id' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {!customer && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-800 shadow-inner">
                <p className="font-medium">顧客データを登録すると、より多くの機能をご利用いただけます。</p>
                <button
                  onClick={() => navigate('/customer-data-registration')}
                  className="mt-3 text-amber-700 underline-offset-4 transition hover:text-amber-900 hover:underline"
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
