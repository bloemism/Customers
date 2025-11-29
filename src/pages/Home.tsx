import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, CreditCard, ChevronRight, Smartphone, Search, Star } from 'lucide-react';

// ヒーロー画像（文字無し）
const HERO_BG = '/hero-bg.png';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-[#E0D6C8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl" style={{ color: '#5C6B4A' }}>✿</span>
              <span 
                className="text-lg sm:text-xl tracking-[0.15em]"
                style={{ 
                  fontFamily: "'Cormorant Garamond', serif",
                  color: '#3D4A35',
                  fontWeight: 500
                }}
              >
                87app
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/customer-signup')}
                className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm tracking-[0.1em] transition-all duration-300 border rounded-sm"
                style={{ 
                  borderColor: '#5C6B4A',
                  color: '#5C6B4A'
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
              <button
                onClick={() => navigate('/customer-login')}
                className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm tracking-[0.1em] transition-all duration-300 rounded-sm"
                style={{ 
                  backgroundColor: '#5C6B4A',
                  color: '#FAF8F5'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4A5D4A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#5C6B4A';
                }}
              >
                ログイン
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="relative min-h-screen pt-20 flex items-center justify-center">
        {/* 背景画像 */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/50 via-[#FAF8F5]/20 to-[#FAF8F5]/40" />

        {/* コンテンツ */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="mb-8 sm:mb-12">
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-6"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26',
                fontWeight: 600,
                lineHeight: 1.6,
                textShadow: '0 2px 8px rgba(250,248,245,0.8), 0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              お花が好きな人の<br />ためのアプリ
            </h1>
            <p 
              className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8"
              style={{ 
                color: '#2D2A26',
                fontWeight: 600,
                lineHeight: 1.8,
                textShadow: '0 1px 4px rgba(250,248,245,0.8)'
              }}
            >
              花のある生活を、もっとスマートに。<br className="hidden sm:block" />
              あなただけの「行きつけ」を見つける旅へ。
            </p>
          </div>
        </div>

        {/* ボタンを画像のDownload Now位置に配置（絶対位置で下部中央） */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 z-10 text-center px-4 w-full max-w-xs sm:max-w-none"
          style={{ bottom: '8%' }}
        >
          <button
            onClick={() => navigate('/customer-signup')}
            className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-4 text-sm sm:text-base tracking-[0.1em] transition-all duration-300 rounded-sm shadow-lg w-full sm:w-auto"
            style={{ 
              backgroundColor: '#5C6B4A',
              color: '#FAF8F5'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4A5D4A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5C6B4A';
            }}
          >
            <span>無料で始める</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* 機能セクション1: フローリストマップ */}
      <section className="py-12 sm:py-16 md:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div className="order-2 md:order-1">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ backgroundColor: '#F0EDE8' }}
              >
                <MapPin className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                <span className="text-xs tracking-[0.2em]" style={{ color: '#5C6B4A' }}>FLORIST MAP</span>
              </div>
              <h2 
                className="text-2xl md:text-3xl mb-6"
                style={{ 
                  fontFamily: "'Noto Serif JP', serif",
                  color: '#2D2A26',
                  fontWeight: 500,
                  lineHeight: 1.8
                }}
              >
                あなただけの「行きつけ」を<br />
                見つける旅へ
              </h2>
              <p 
                className="text-sm leading-loose mb-8"
                style={{ color: '#2D2A26', lineHeight: 2, fontWeight: 500 }}
              >
                GPS位置情報を使って、現在地周辺の花屋を瞬時に検索。
                隠れ家のようなアトリエから、洗練されたブティックまで、
                店舗の雰囲気や得意なスタイルを美しい写真で比較しながら、
                運命の一軒を探せます。
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>住所・エリアから検索</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>GPS現在地から最寄りを表示</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>お気に入り店舗を保存</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/map.png" 
                  alt="フローリストマップ" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 機能セクション2: レッスン予約 */}
      <section className="py-12 sm:py-16 md:py-24" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div>
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/lesson.png" 
                  alt="フラワーレッスン" 
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div>
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ backgroundColor: '#FAF8F5' }}
              >
                <Calendar className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                <span className="text-xs tracking-[0.2em]" style={{ color: '#5C6B4A' }}>FLOWER LESSON</span>
              </div>
              <h2 
                className="text-2xl md:text-3xl mb-6"
                style={{ 
                  fontFamily: "'Noto Serif JP', serif",
                  color: '#2D2A26',
                  fontWeight: 500,
                  lineHeight: 1.8
                }}
              >
                感性を磨く、<br />
                特別な時間を予約する
              </h2>
              <p 
                className="text-sm leading-loose mb-8"
                style={{ color: '#2D2A26', lineHeight: 2, fontWeight: 500 }}
              >
                週末のご褒美に、季節の花に触れるレッスンはいかがですか？
                本格的なブーケ作り、季節のリース、初心者向けのアレンジメントなど、
                全国で開催される多彩なレッスンを、日時やエリアから
                リアルタイムで検索・予約できます。
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>カレンダーから日程を選択</span>
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>スマホで簡単予約</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>参加でポイント獲得</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 機能セクション3: スマート決済 */}
      <section className="py-12 sm:py-16 md:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div className="order-2 md:order-1">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ backgroundColor: '#F0EDE8' }}
              >
                <CreditCard className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                <span className="text-xs tracking-[0.2em]" style={{ color: '#5C6B4A' }}>SMART PAYMENT</span>
              </div>
              <h2 
                className="text-2xl md:text-3xl mb-6"
                style={{ 
                  fontFamily: "'Noto Serif JP', serif",
                  color: '#2D2A26',
                  fontWeight: 500,
                  lineHeight: 1.8
                }}
              >
                花のある生活を、<br />
                もっとスマートに
              </h2>
              <p 
                className="text-sm leading-loose mb-8"
                style={{ color: '#2D2A26', lineHeight: 2, fontWeight: 500 }}
              >
                会員コードを見せるだけで、スムーズな会員認証とポイント付与を実現。
                アプリで決済すれば、レッスンも店頭でのお買い物も
                キャッシュレスでスマートに。クレジットカードで安全・簡単に
                お支払いいただけます。
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>クレジットカード決済対応</span>
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>決済コードでスピード決済</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 500 }}>お買い物でポイント還元</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/credit.png" 
                  alt="スマート決済" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section 
        className="py-12 sm:py-16 md:py-24"
        style={{ backgroundColor: '#5C6B4A' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 
            className="text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6"
            style={{ 
              fontFamily: "'Noto Serif JP', serif",
              color: '#FAF8F5',
              fontWeight: 400,
              lineHeight: 1.8
            }}
          >
            花と過ごす、丁寧な暮らしを<br />
            今日から始めてみませんか。
          </h2>
          <p 
            className="text-xs sm:text-sm mb-6 sm:mb-10"
            style={{ color: '#E0D6C8' }}
          >
            87appは無料でご利用いただけます
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => navigate('/customer-signup')}
              className="px-6 sm:px-10 py-3 sm:py-4 text-xs sm:text-sm tracking-[0.15em] transition-all duration-300 rounded-sm"
              style={{ 
                backgroundColor: '#FAF8F5',
                color: '#3D4A35'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F5F0E8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FAF8F5';
              }}
            >
              無料で始める
            </button>
            <button
              onClick={() => navigate('/customer-login')}
              className="px-6 sm:px-10 py-3 sm:py-4 text-xs sm:text-sm tracking-[0.15em] transition-all duration-300 rounded-sm border"
              style={{ 
                borderColor: '#FAF8F5',
                color: '#FAF8F5',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(250,248,245,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ログイン
            </button>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-12" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xl" style={{ color: '#5C6B4A' }}>✿</span>
              <span 
                className="text-lg tracking-[0.15em]"
                style={{ 
                  fontFamily: "'Cormorant Garamond', serif",
                  color: '#3D4A35'
                }}
              >
                87app
              </span>
            </div>
            <div className="flex gap-8 text-xs" style={{ color: '#5A5651' }}>
              <button onClick={() => navigate('/readme')} className="hover:underline">利用規約</button>
              <button onClick={() => navigate('/privacy-and-payment')} className="hover:underline">プライバシーポリシー</button>
              <span>お問い合わせ</span>
            </div>
            <p 
              className="text-xs"
              style={{ color: '#2D2A26', fontWeight: 500 }}
            >
              © 2024 87app
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
