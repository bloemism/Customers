import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { QrCode, User, Mail, Star, ArrowLeft, Copy, Check, RefreshCw, Flower } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';


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

export const CustomerQRCode: React.FC = () => {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const [copied, setCopied] = useState(false);
  const [qrRefresh, setQrRefresh] = useState(0);

  const getLevelInfo = (level: string) => {
    return levelConfig[level as keyof typeof levelConfig] || levelConfig.BASIC;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('コピーに失敗しました:', error);
    }
  };

  const generateQRData = () => {
    if (!customer) return '';
    return JSON.stringify({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      timestamp: new Date().toISOString(),
      refresh: qrRefresh
    });
  };

  const refreshQR = () => {
    setQrRefresh(prev => prev + 1);
  };

  // 顧客データが存在しない場合は、デフォルト値を設定
  const defaultCustomer = customer || {
    id: 'guest-12345',
    user_id: '',
    name: 'ゲストユーザー',
    email: 'guest@example.com',
    phone: '',
    points: 0,
    level: 'BASIC' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const levelInfo = getLevelInfo(defaultCustomer.level);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/customer-menu')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </button>
            <div className="flex items-center space-x-2">
              <Flower className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">87app</h1>
            </div>
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-md mx-auto px-4 py-8">
        {/* QRコードカード - 青い縦バー */}
        <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-3xl shadow-2xl p-8 mb-6">
          <div className="text-center">
            {/* ヘッダー */}
            <div className="mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <QrCode className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">マイQRコード</h2>
              <p className="text-sm text-white/80">店舗でスキャンして決済</p>
            </div>

            {/* QRコード */}
            <div className="relative mb-8 flex justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={generateQRData()}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              
              {/* リフレッシュボタン */}
              <button
                onClick={refreshQR}
                className="absolute -top-2 -right-2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-white transition-all duration-300"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {/* ポイント表示 */}
            <div className="bg-white/20 rounded-2xl p-6 mb-6 text-white">
              <div className="flex items-center justify-center space-x-3">
                <Star className="h-6 w-6 text-yellow-300" />
                <div>
                  <div className="text-3xl font-bold">{defaultCustomer.points}</div>
                  <div className="text-sm opacity-90">ポイント</div>
                </div>
              </div>
            </div>

            {/* レベル表示 */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className={`w-12 h-12 rounded-full shadow-lg ${
                levelInfo.name === 'ベーシック' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                levelInfo.name === 'レギュラー' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                levelInfo.name === 'プロ' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                'bg-gradient-to-br from-yellow-400 to-yellow-600'
              }`}></div>
              <div className="text-left">
                <div className="text-lg font-semibold text-white">
                  {levelInfo.name}
                </div>
                <div className="text-xs text-white/70">
                  {levelInfo.minPoints}-{levelInfo.maxPoints}pt
                </div>
              </div>
            </div>

            {/* 有効期限 */}
            <div className="text-xs text-white/60">
              QRコードの有効期限: 5分
            </div>
          </div>
        </div>

        {/* 顧客情報カード */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <User className="h-5 w-5 mr-2 text-gray-600" />
            顧客情報
          </h3>
          
          <div className="space-y-5">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">お名前</p>
                <p className="font-medium text-gray-800 text-lg">{defaultCustomer.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">メールアドレス</p>
                <p className="font-medium text-gray-800">{defaultCustomer.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <div className="text-blue-600 font-bold text-sm">ID</div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">顧客ID</p>
                <div className="flex items-center space-x-2">
                  <code className="font-mono text-sm bg-gray-100 px-3 py-2 rounded-lg text-gray-700 border border-gray-200">
                    {defaultCustomer.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(defaultCustomer.id)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {!customer && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
                <p className="text-sm text-amber-700 mb-2">
                  ※ 顧客データを登録すると、より多くの機能をご利用いただけます
                </p>
                <button
                  onClick={() => navigate('/customer-data-registration')}
                  className="text-sm text-amber-600 hover:text-amber-800 underline font-medium"
                >
                  顧客データを登録する →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
