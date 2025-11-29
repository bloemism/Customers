import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, QrCode, Star, Gift, CreditCard, Calendar, MapPin, BookOpen } from 'lucide-react';

// 背景画像
const BG_IMAGE = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

export const CustomerReadmePage: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: User,
      title: 'アカウント登録',
      content: (
        <>
          <p className="mb-4">アカウント登録をしてログイン出来ましたら、マイプロフィールを設定しましょう。</p>
          <div 
            className="rounded-sm p-5"
            style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}
          >
            <p className="font-medium mb-3" style={{ color: '#5C6B4A' }}>登録に必要な情報：</p>
            <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
              <li>• お名前（必須）</li>
              <li>• メールアドレス（必須）</li>
              <li>• 住所（町名まで）※ プライバシー保護の観点から</li>
              <li>• 誕生日</li>
              <li>• パスワード（6文字以上）</li>
            </ul>
          </div>
        </>
      )
    },
    {
      icon: Star,
      title: 'ポイントシステム',
      content: (
        <>
          <p className="mb-4">顧客アカウントが出来ると、全国フローリストマップに掲載されている花屋の全ての全国の店舗で、ご購入頂いた金額の<strong style={{ color: '#5C6B4A' }}>5%がポイント</strong>として貯まり、次回以降に使用出来るようになります。</p>
          
          <div 
            className="rounded-sm p-5 mb-4"
            style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}
          >
            <p className="font-medium mb-3" style={{ color: '#5C6B4A' }}>ポイント使用について：</p>
            <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
              <li>• 使用限度額は一度の<strong>1500ポイント程度</strong></li>
              <li>• <strong>1ポイント1円</strong>に対する金額としてお使いできます</li>
              <li>• 交換できるものは店舗により異なります</li>
            </ul>
          </div>

          <div 
            className="rounded-sm p-5 mb-4"
            style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <p className="font-medium mb-2" style={{ color: '#DC2626' }}>⚠️ ポイント使用制限期間</p>
            <p className="text-sm" style={{ color: '#B91C1C' }}>
              母の日前、年末前、クリスマス前の<strong>1週間は使用できません</strong>のでご注意ください。
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'ベーシック', range: '0-99pt', progress: 25 },
              { name: 'レギュラー', range: '100-499pt', progress: 50 },
              { name: 'プロ', range: '500-999pt', progress: 75 },
              { name: 'エキスパート', range: '1000pt以上', progress: 100 }
            ].map((level, i) => (
              <div 
                key={i}
                className="rounded-sm p-3"
                style={{ backgroundColor: '#FDFCFA', border: '1px solid #E0D6C8' }}
              >
                <p className="text-sm font-medium" style={{ color: '#3D4A35' }}>{level.name}</p>
                <p className="text-xs" style={{ color: '#8A857E' }}>{level.range}</p>
                <div 
                  className="h-1 rounded-full mt-2"
                  style={{ backgroundColor: '#E0D6C8' }}
                >
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${level.progress}%`, backgroundColor: '#5C6B4A' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )
    },
    {
      icon: Gift,
      title: '全国へのお花贈り',
      content: (
        <>
          <p className="mb-4">全国へのお花贈りにも、お届け先のご住所のお近くの掲載店舗のSNSなどの画像を確認の上、メールや電話でお問い合わせください。</p>
          <div 
            className="rounded-sm p-5"
            style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}
          >
            <p className="font-medium mb-3" style={{ color: '#5C6B4A' }}>お花贈りの流れ：</p>
            <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
              <li>• お届け先住所のお近くの店舗を確認</li>
              <li>• 店舗のSNS画像を確認</li>
              <li>• メールや電話で直接お問い合わせ</li>
              <li>• 1週間前までの発注でしたら、ポイント使用も可能</li>
            </ul>
          </div>
        </>
      )
    },
    {
      icon: QrCode,
      title: 'マイ顧客コード',
      content: (
        <>
          <p className="mb-4">マイ顧客コードでは、ご自身の顧客アカウントデータやポイントなどの情報がデータベースに組み込まれ、アルファベットと数字に置き換えられ作られます。</p>
          <div 
            className="rounded-sm p-5"
            style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}
          >
            <p className="font-medium mb-3" style={{ color: '#5C6B4A' }}>店舗での使用方法：</p>
            <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
              <li>• 小売店舗で残ポイントの掲示を求められます</li>
              <li>• 使用ポイント数は直接口頭でお話しください</li>
              <li>• レッスン教室では先生に顧客コードを登録してもらう</li>
              <li>• 支払い決済のデータは決済履歴に反映</li>
            </ul>
          </div>
        </>
      )
    },
    {
      icon: Calendar,
      title: 'フラワーレッスン',
      content: (
        <>
          <p className="mb-4">フラワーレッスンマップでは、地域ごとのフラワースクールが登録されています。興味のある方は詳細を見て、メールにて直接お問い合わせ、体験レッスンなどをしてみてください。</p>
          <div 
            className="rounded-sm p-5"
            style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}
          >
            <p className="font-medium mb-3" style={{ color: '#5C6B4A' }}>レッスンについて：</p>
            <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
              <li>• 住所の詳細は明記しておりません</li>
              <li>• マイ顧客コードを先生に見せ登録してもらう</li>
              <li>• スケジュール管理のページに次回レッスンが表示</li>
              <li>• ご都合の良いレッスン日を選択し登録</li>
            </ul>
          </div>
        </>
      )
    },
    {
      icon: MapPin,
      title: '人気ランキング',
      content: (
        <p>人気ランキングは、全国の地域の人気の花を月単位で見ることができます。ぜひお楽しみください。</p>
      )
    },
    {
      icon: CreditCard,
      title: '決済について',
      content: (
        <>
          <p className="mb-4">支払いは現金やクレジットなどの決済になります。店舗にお伝えください。</p>
          <div 
            className="rounded-sm p-5"
            style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}
          >
            <p className="font-medium mb-2" style={{ color: '#5C6B4A' }}>重要なお知らせ</p>
            <p className="text-sm" style={{ color: '#5A5651' }}>
              クレジットデータは運営は取っておりません。データベースはより良いお花を愛する方々と、花業界の発展のために使われます。何かございましたら <strong>deblwinkel@gmail.com</strong> までご連絡ください。
            </p>
          </div>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 無地背景 */}

      {/* ヘッダー */}
      <header 
        className="sticky top-0 z-50 border-b"
        style={{ 
          backgroundColor: 'rgba(250,248,245,0.95)',
          backdropFilter: 'blur(8px)',
          borderColor: '#E0D6C8'
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/customer-menu')}
              className="flex items-center gap-2 text-sm transition-colors mr-4"
              style={{ color: '#5A5651' }}
            >
              <ArrowLeft className="w-5 h-5" />
              戻る
            </button>
            <h1 
              className="text-lg"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#2D2A26'
              }}
            >
              87app ご利用ガイド
            </h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* イントロダクション */}
          <div 
            className="rounded-sm p-8 text-center"
            style={{ 
              backgroundColor: 'rgba(92,107,74,0.95)'
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(250,248,245,0.15)' }}
            >
              <BookOpen className="w-8 h-8" style={{ color: '#FAF8F5' }} />
            </div>
            <h1 
              className="text-2xl md:text-3xl mb-2"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#FAF8F5'
              }}
            >
              87app ご利用ガイド
            </h1>
            <p style={{ color: 'rgba(250,248,245,0.8)' }}>
              お花が好きな人のためのアプリ
            </p>
          </div>

          {/* セクション */}
          {sections.map((section, index) => (
            <div 
              key={index}
              className="rounded-sm p-6 md:p-8"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: '1px solid #E0D6C8'
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#F5F0E8' }}
                >
                  <section.icon className="w-6 h-6" style={{ color: '#5C6B4A' }} />
                </div>
                <h2 
                  className="text-xl"
                  style={{ 
                    fontFamily: "'Noto Serif JP', serif",
                    color: '#2D2A26'
                  }}
                >
                  {index + 1}. {section.title}
                </h2>
              </div>
              <div 
                className="text-sm leading-relaxed"
                style={{ color: '#5A5651' }}
              >
                {section.content}
              </div>
            </div>
          ))}

          {/* フッター */}
          <div 
            className="rounded-sm p-8 text-center"
            style={{ 
              backgroundColor: 'rgba(92,107,74,0.95)'
            }}
          >
            <h2 
              className="text-2xl mb-2"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                color: '#FAF8F5',
                fontWeight: 600
              }}
            >
              87app
            </h2>
            <p style={{ color: 'rgba(250,248,245,0.8)' }}>
              お花が好きな人のためのアプリ
            </p>
            <p 
              className="text-sm mt-4"
              style={{ color: 'rgba(250,248,245,0.6)' }}
            >
              より良いお花ライフをお楽しみください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
