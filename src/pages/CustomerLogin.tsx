import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

// 背景画像
const LOGIN_BG = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

export const CustomerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useCustomerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      navigate('/customer-menu');
    } catch (error: any) {
      console.error('ログインエラー:', error);
      setError('ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 無地背景 */}
      
      <div 
        className="relative z-10 w-full max-w-md"
      >
        {/* 戻るボタン */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-8 text-sm transition-all duration-300"
          style={{ color: '#2D2A26', fontWeight: 500 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#3D4A35';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#2D2A26';
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          トップページに戻る
        </button>

        {/* ログインカード */}
        <div 
          className="rounded-sm p-8 md:p-10"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #E0D6C8'
          }}
        >
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
              style={{ backgroundColor: '#F5F0E8' }}
            >
              🌸
            </div>
            <h1 
              className="text-2xl mb-2"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26'
              }}
            >
              ログイン
            </h1>
            <p 
              className="text-sm"
              style={{ color: '#3D3A36', fontWeight: 500 }}
            >
              87appで花のある生活を楽しもう
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div 
              className="rounded-sm p-4 mb-6"
              style={{ 
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA'
              }}
            >
              <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* メールアドレス */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs tracking-[0.1em] mb-2"
                style={{ color: '#2D2A26', fontWeight: 500 }}
              >
                メールアドレス
              </label>
              <div className="relative">
                <Mail 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  style={{ color: '#3D3A36', fontWeight: 500 }}
                />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-sm transition-all duration-200"
                  style={{ 
                    backgroundColor: '#FDFCFA',
                    border: '1px solid #E0D6C8',
                    color: '#2D2A26'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5C6B4A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0D6C8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-xs tracking-[0.1em] mb-2"
                style={{ color: '#2D2A26', fontWeight: 500 }}
              >
                パスワード
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  style={{ color: '#3D3A36', fontWeight: 500 }}
                />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-sm transition-all duration-200"
                  style={{ 
                    backgroundColor: '#FDFCFA',
                    border: '1px solid #E0D6C8',
                    color: '#2D2A26'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5C6B4A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0D6C8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="パスワード"
                  required
                />
              </div>
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-sm text-sm tracking-[0.15em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#5C6B4A',
                color: '#FAF8F5'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#4A5D4A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5C6B4A';
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  ログイン中...
                </div>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

          {/* 区切り線 */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px" style={{ backgroundColor: '#E0D6C8' }} />
            <span className="text-xs" style={{ color: '#8A857E' }}>または</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#E0D6C8' }} />
          </div>

          {/* 登録リンク */}
          <div className="text-center space-y-4">
            <p className="text-sm" style={{ color: '#5A5651' }}>
              アカウントをお持ちでない方は
            </p>
            <button
              onClick={() => navigate('/customer-signup')}
              className="w-full py-3 rounded-sm text-sm tracking-[0.1em] transition-all duration-300 border"
              style={{ 
                borderColor: '#5C6B4A',
                color: '#5C6B4A',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5C6B4A';
                e.currentTarget.style.color = '#FAF8F5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#5C6B4A';
              }}
            >
              新規登録
            </button>
          </div>

          {/* 店舗向けリンク */}
          <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: '#E0D6C8' }}>
            <p className="text-xs" style={{ color: '#8A857E' }}>
              店舗・スクールの方は{' '}
              <button
                onClick={() => navigate('/simple-login')}
                className="underline transition-colors"
                style={{ color: '#5C6B4A' }}
              >
                こちら
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
