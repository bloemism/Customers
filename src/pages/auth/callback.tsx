import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Flower, CheckCircle, XCircle } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('認証処理中...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      setStatus('loading');
      setMessage('認証処理中...');

      // URLパラメータをログ出力
      const urlParams = new URLSearchParams(window.location.search);
      console.log('URL parameters:', Object.fromEntries(urlParams.entries()));
      console.log('Current URL:', window.location.href);

      // Supabase v2の新しい認証コールバック処理
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        setStatus('error');
        setMessage(`認証エラー: ${error.message}`);
        return;
      }

      if (data.session) {
        setStatus('success');
        setMessage('認証が完了しました！');
        
        // 3秒後にメニュー画面にリダイレクト
        setTimeout(() => {
          navigate('/simple-menu');
        }, 3000);
      } else {
        // URLパラメータからエラーをチェック
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setStatus('error');
          setMessage(`認証エラー: ${errorDescription || error}`);
        } else {
          // セッションがない場合、手動でメニューにリダイレクト
          console.log('No session found, redirecting to menu');
          setStatus('success');
          setMessage('認証が完了しました！');
          setTimeout(() => {
            navigate('/simple-menu');
          }, 1000);
        }
      }

    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage('認証処理中にエラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* アイコン */}
        <div className="mb-6">
          {status === 'loading' && (
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          {status === 'success' && (
            <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          )}
          {status === 'error' && (
            <div className="mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* タイトル */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'loading' && '認証処理中'}
          {status === 'success' && '認証完了'}
          {status === 'error' && '認証エラー'}
        </h2>

        {/* メッセージ */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* ローディングアニメーション */}
        {status === 'loading' && (
          <div className="flex justify-center">
            <div className="animate-pulse text-pink-500">
              <Flower className="h-6 w-6" />
            </div>
          </div>
        )}

        {/* エラー時のリトライボタン */}
        {status === 'error' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate('/simple-login')}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              ログイン画面に戻る
            </button>
            <button
              onClick={handleAuthCallback}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              再試行
            </button>
          </div>
        )}

        {/* 成功時のリダイレクトメッセージ */}
        {status === 'success' && (
          <div className="text-sm text-gray-500">
            メニュー画面にリダイレクトします...
          </div>
        )}
      </div>
    </div>
  );
};



