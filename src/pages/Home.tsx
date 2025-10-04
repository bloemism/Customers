import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower, MapPin, QrCode, Star, ArrowRight, Sparkles } from 'lucide-react';
import greenhouseImage from '../assets/greenhouse-pathway.jpg';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景画像 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${greenhouseImage})`
        }}
      >
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ヘッダー */}
        <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-white/30 relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full">
                  <Flower className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  87app
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    console.log('新規登録ボタンがクリックされました');
                    navigate('/customer-signup');
                  }}
                  className="bg-white text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors border-2 border-pink-300 px-4 py-2 rounded-lg hover:bg-pink-50 hover:border-pink-400 shadow-md hover:shadow-lg cursor-pointer"
                  style={{ minWidth: '80px', minHeight: '36px' }}
                >
                  新規登録
                </button>
                <button
                  onClick={() => {
                    console.log('ログインボタンがクリックされました');
                    navigate('/customer-login');
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                  style={{ minWidth: '80px', minHeight: '36px' }}
                >
                  ログイン
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ヒーローセクション */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          {/* 背景オーバーレイ */}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* メインタイトル */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-2xl">
                <Flower className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl shadow-black/50">
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  87app
                </span>
              </h1>
              <p className="text-2xl md:text-3xl text-white mb-6 font-bold drop-shadow-2xl shadow-black/50">
                お花が好きな人のためのアプリ
              </p>
              <div className="max-w-3xl mx-auto">
                <p className="text-lg md:text-xl text-white mb-4 leading-relaxed drop-shadow-2xl shadow-black/50 font-medium">
                  美しいお花と出会い、特別な体験を楽しもう
                </p>
                <p className="text-base md:text-lg text-white leading-relaxed drop-shadow-2xl shadow-black/50">
                  全国の花屋やフラワーレッスンを見つけて、<br />
                  あなたの花のある生活を始めましょう
                </p>
              </div>
            </div>

            {/* 機能紹介 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">花屋を探す</h3>
                <p className="text-gray-600 text-sm">全国の花屋を地図で検索して、お気に入りのお店を見つけよう</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">ポイント獲得</h3>
                <p className="text-gray-600 text-sm">購入時にQRコードをスキャンして、ポイントを貯めよう</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">レッスン体験</h3>
                <p className="text-gray-600 text-sm">フラワーレッスンに参加して、新しいスキルを身につけよう</p>
              </div>
            </div>

            {/* CTAボタン */}
            <div className="space-y-4">
              <button
                onClick={() => navigate('/customer-signup')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>無料で始める</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              </button>
              
              <div className="text-sm text-gray-500">
                既にアカウントをお持ちの方は{' '}
                <button
                  onClick={() => navigate('/customer-login')}
                  className="text-pink-600 hover:text-pink-700 font-medium underline"
                >
                  こちらからログイン
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* フッター */}
        <footer className="bg-white/50 backdrop-blur-sm border-t border-white/20 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-white/80 text-sm drop-shadow-md">
              © 2024 87app. お花のある生活を、もっと楽しく。
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
