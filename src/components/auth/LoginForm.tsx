import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Flower } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
        // アカウント作成成功後、ログイン画面に戻る
        setIsSignUp(false);
        setError('');
      } else {
        await signIn(email, password);
        navigate('/menu');
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mb-4">
            <Flower className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </h2>
          <p className="text-gray-600">
            {isSignUp ? '新しいアカウントを作成してください' : '花屋管理アプリへようこそ'}
          </p>
      </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* メールアドレス */}
        <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
            <input
              id="email"
                  name="email"
              type="email"
                  autoComplete="email"
                  required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="example@email.com"
            />
          </div>
        </div>

            {/* パスワード */}
        <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            パスワード
          </label>
          <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
            <input
              id="password"
                  name="password"
              type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="パスワードを入力"
            />
            <button
              type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
            </button>
              </div>
          </div>
        </div>

          {/* エラーメッセージ */}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

          {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              isSignUp ? 'アカウント作成' : 'ログイン'
            )}
        </button>
      </form>

        {/* モード切り替え */}
        <div className="text-center space-y-4">
          <button
            type="button"
            onClick={toggleMode}
            className="text-pink-600 hover:text-pink-700 font-medium transition-colors duration-200"
          >
            {isSignUp ? '既存のアカウントでログイン' : '店舗管理者アカウント作成'}
          </button>
          
          {!isSignUp && (
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">店舗オーナーとして登録しますか？</p>
                <Link
                  to="/store-owner-registration"
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                >
                  店舗オーナー登録
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">顧客として登録しますか？</p>
                <Link
                  to="/customer-registration"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  顧客アカウント作成
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="text-center text-sm text-gray-500">
          <p>87app - 花屋向け店舗管理システム</p>
        </div>
      </div>
    </div>
  );
};
