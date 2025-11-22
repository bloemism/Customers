import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('認証コールバック処理開始');
        console.log('現在のURL:', window.location.href);
        console.log('URLパラメータ:', window.location.search);
        
        // URLから認証コードを取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          console.log('認証コードを取得:', code);
          
          // 認証コードを使ってセッションを取得
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          console.log('認証コード交換結果:', { data, error });
          
          if (error) {
            console.error('認証コード交換エラー:', error);
            setTimeout(() => {
              navigate('/simple-login');
            }, 2000);
            return;
          }

          if (data.session) {
            console.log('認証成功、メニューにリダイレクトします');
            console.log('ユーザー情報:', data.session.user);
            setTimeout(() => {
              navigate('/simple-menu');
            }, 1000);
          } else {
            console.log('セッションが取得できませんでした');
            setTimeout(() => {
              navigate('/simple-login');
            }, 2000);
          }
        } else {
          console.log('認証コードが見つかりません');
          // 通常のセッション確認を試行
          const { data, error } = await supabase.auth.getSession();
          
          if (data.session) {
            console.log('既存のセッションを確認、メニューにリダイレクトします');
            setTimeout(() => {
              navigate('/simple-menu');
            }, 1000);
          } else {
            console.log('セッションが見つかりません、ログインページにリダイレクトします');
            setTimeout(() => {
              navigate('/simple-login');
            }, 2000);
          }
        }
      } catch (error) {
        console.error('認証コールバック処理エラー:', error);
        setTimeout(() => {
          navigate('/simple-login');
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">認証処理中...</p>
        <p className="text-white text-sm mt-2">しばらくお待ちください...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
