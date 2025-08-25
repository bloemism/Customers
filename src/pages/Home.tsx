import React from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Flower, User, LogOut, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  const { user, signOut } = useSimpleAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGoToMenu = () => {
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Flower className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">87app</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                  <button
                    onClick={handleGoToMenu}
                    className="flex items-center space-x-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    <span>メニュー</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>ログアウト</span>
                  </button>
                </>
              ) : (
                <a href="/simple-login" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  ログイン
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {user ? (
          <div className="text-center py-12">
            <div className="max-w-2xl mx-auto">
              <Flower className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                87app へようこそ
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                花屋向け店舗管理システムで、ビジネスを効率化しましょう
              </p>
              <button
                onClick={handleGoToMenu}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <span>メニューを開く</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-2xl mx-auto">
              <Flower className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                87app 花屋向け店舗管理システム
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                商品管理、顧客管理、QR決済、フラワーレッスン管理など、花屋の業務を効率化するための総合システムです。
              </p>
              <a
                href="/simple-login"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                ログインして始める
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
