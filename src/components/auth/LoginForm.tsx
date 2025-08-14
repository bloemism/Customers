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
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error, user } = await signUp(email, password);
        if (!error && user) {
          // アカウント作成成功
          setMessage(`アカウント「${email}」が正常に作成されました！ログインしてください。`);
          setIsSignUp(false);
          setEmail('');
          setPassword('');
          
          // 3秒後にメッセージをクリア
          setTimeout(() => {
            setMessage('');
          }, 5000);
        } else {
          setError(error?.message || 'アカウント作成に失敗しました');
        }
      } else {
        const { error } = await signIn(email, password);
        if (!error) {
          // ログイン成功
          navigate('/menu');
        } else {
          setError(error.message || 'ログインに失敗しました');
        }
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

        {/* 成功メッセージ */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {message}
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

        {/* 区切り線 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">または</span>
          </div>
        </div>

        {/* Google認証ボタン（一時的に無効化） */}
        <button
          type="button"
          disabled={true}
          className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg text-gray-400 bg-gray-100 cursor-not-allowed transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google認証（準備中）
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
