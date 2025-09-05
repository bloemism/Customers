import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../../contexts/SimpleAuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';

export const SimpleLoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useSimpleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        // ログイン成功後は、ユーザータイプに応じてリダイレクト
        // CustomerAuthGuardが適切なページにリダイレクトする
        navigate('/simple-menu');
      }
    } catch (error) {
      setError('ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      setError('Googleログインに失敗しました');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            87app
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-purple-300" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-purple-300" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <LogIn className="h-5 w-5 mr-2" />
            )}
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-purple-200">または</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full mt-4 bg-white text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {googleLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800 mr-2"></div>
            ) : (
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Googleログイン中...' : 'Googleでログイン'}
          </button>
        </div>

        <div className="mt-6 text-center space-y-3">
          <p className="text-purple-200 text-sm">
            アカウントをお持ちでない方は
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/simple-signup')}
              className="block w-full text-purple-300 hover:text-white transition-colors duration-200 underline text-sm"
            >
              店舗・スクール向け登録
            </button>
            <button
              onClick={() => navigate('/customer-signup')}
              className="block w-full text-blue-300 hover:text-white transition-colors duration-200 underline text-sm"
            >
              顧客向け登録
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
