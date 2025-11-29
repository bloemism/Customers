import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';

// 背景画像
const SIGNUP_BG = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

export const CustomerSignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useCustomerAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError('必須項目を入力してください');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return false;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('有効なメールアドレスを入力してください');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.name
      );

      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        navigate('/customer-data-registration');
      } else {
        setError('認証できず');
      }
    } catch (error: any) {
      console.error('登録エラー:', error);
      setError(error.message || '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 成功画面
  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#FAF8F5' }}
      >
        <div 
          className="rounded-sm p-10 max-w-md w-full text-center"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#E8EDE4' }}
          >
            <Check className="w-8 h-8" style={{ color: '#5C6B4A' }} />
          </div>
          <h2 
            className="text-2xl mb-4"
            style={{ 
              fontFamily: "'Noto Serif JP', serif",
              color: '#2D2A26'
            }}
          >
            登録完了
          </h2>
          <p 
            className="text-sm mb-6"
            style={{ color: '#2D2A26', fontWeight: 500 }}
          >
            顧客アカウントが正常に作成されました。<br />
            ログイン画面に移動します...
          </p>
          <div 
            className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
            style={{ 
              borderColor: '#E0D6C8',
              borderTopColor: '#5C6B4A'
            }}
          />
        </div>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: '#FDFCFA',
    border: '1px solid #E0D6C8',
    color: '#2D2A26'
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 無地背景 */}
      
      <div className="relative z-10 w-full max-w-md">
        {/* 戻るボタン */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-8 text-sm transition-all duration-300"
          style={{ color: '#5A5651' }}
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

        {/* 登録カード */}
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
              🌷
            </div>
            <h1 
              className="text-2xl mb-2"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26'
              }}
            >
              新規登録
            </h1>
            <p 
              className="text-sm"
              style={{ color: '#3D3A36', fontWeight: 500 }}
            >
              花のある暮らしを始めましょう
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 名前 */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-xs tracking-[0.1em] mb-2"
                style={{ color: '#2D2A26', fontWeight: 500 }}
              >
                お名前 <span style={{ color: '#C4856C' }}>*</span>
              </label>
              <div className="relative">
                <User 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  style={{ color: '#3D3A36', fontWeight: 500 }}
                />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 rounded-sm transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5C6B4A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0D6C8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="山田 花子"
                  required
                />
              </div>
            </div>

            {/* メールアドレス */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs tracking-[0.1em] mb-2"
                style={{ color: '#2D2A26', fontWeight: 500 }}
              >
                メールアドレス <span style={{ color: '#C4856C' }}>*</span>
              </label>
              <div className="relative">
                <Mail 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  style={{ color: '#3D3A36', fontWeight: 500 }}
                />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 rounded-sm transition-all duration-200"
                  style={inputStyle}
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
                パスワード <span style={{ color: '#C4856C' }}>*</span>
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  style={{ color: '#3D3A36', fontWeight: 500 }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-12 py-3 rounded-sm transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5C6B4A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0D6C8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="6文字以上"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors"
                  style={{ color: '#3D3A36', fontWeight: 500 }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* パスワード確認 */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-xs tracking-[0.1em] mb-2"
                style={{ color: '#2D2A26', fontWeight: 500 }}
              >
                パスワード確認 <span style={{ color: '#C4856C' }}>*</span>
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  style={{ color: '#3D3A36', fontWeight: 500 }}
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-12 py-3 rounded-sm transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5C6B4A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0D6C8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="パスワードを再入力"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors"
                  style={{ color: '#3D3A36', fontWeight: 500 }}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-sm text-sm tracking-[0.15em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
                  登録中...
                </div>
              ) : (
                'アカウントを作成'
              )}
            </button>
          </form>

          {/* ログインリンク */}
          <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: '#E0D6C8' }}>
            <p className="text-sm" style={{ color: '#5A5651' }}>
              既にアカウントをお持ちの方は{' '}
              <button
                onClick={() => navigate('/customer-login')}
                className="underline transition-colors"
                style={{ color: '#5C6B4A' }}
              >
                ログイン
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
