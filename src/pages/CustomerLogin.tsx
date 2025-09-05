import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { Mail, Lock, LogIn, ArrowLeft, User } from 'lucide-react';
import customerLoginBg from '../assets/customer-login-bg.jpg';

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

      // ログイン成功 - 顧客メニューにリダイレクト
      navigate('/customer-menu');
    } catch (error: any) {
      console.error('ログインエラー:', error);
      setError('ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* 背景画像 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${customerLoginBg})`
        }}
      >
      </div>
      
      <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            トップページに戻る
          </button>
          
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">顧客ログイン</h1>
          <p className="text-gray-600">87appでお花を楽しもう！</p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* メールアドレス */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          {/* パスワード */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="パスワード"
                required
              />
            </div>
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ログイン中...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <LogIn className="h-5 w-5 mr-2" />
                ログイン
              </div>
            )}
          </button>
        </form>

        {/* 登録リンク */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            アカウントをお持ちでない方は{' '}
            <button
              onClick={() => navigate('/customer-signup')}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              顧客登録
            </button>
          </p>
        </div>

        {/* 店舗向けリンク */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            店舗・スクールの方は{' '}
            <button
              onClick={() => navigate('/simple-login')}
              className="text-gray-600 hover:text-gray-700 font-medium transition-colors"
            >
              こちら
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
