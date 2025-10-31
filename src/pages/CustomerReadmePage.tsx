import React from 'react';
import { ArrowLeft, User, QrCode, MapPin, Star, Gift, Shield, Mail, BookOpen, Calendar, CreditCard, Home } from 'lucide-react';

export const CustomerReadmePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 relative overflow-hidden">
      {/* アニメーション背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-300/20 to-indigo-300/20 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-purple-300/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-300/15 to-blue-400/15 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* ヘッダー */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </button>
            <h1 className="text-xl font-bold text-gray-900">87app ご利用ガイド</h1>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* イントロダクション */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">87app ご利用ガイド</h1>
              <p className="text-lg text-gray-600">
                お花が好きな人のためのアプリ
              </p>
            </div>
          </div>

          {/* アカウント登録 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">1. アカウント登録</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-medium">アカウント登録をしてログイン出来ましたら、マイプロフィールを設定しましょう。</p>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <h3 className="font-semibold mb-3 text-green-800">登録に必要な情報：</h3>
                <ul className="list-disc list-inside space-y-2 text-green-700">
                  <li>お名前（必須）</li>
                  <li>メールアドレス（必須）</li>
                  <li>住所（町名まで）※ プライバシー保護の観点から</li>
                  <li>誕生日</li>
                  <li>パスワード（6文字以上）</li>
                </ul>
                <p className="mt-3 text-sm text-green-600 font-medium">※ 全てを必ず登録してください。</p>
              </div>
            </div>
          </div>

          {/* ポイントシステム */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">2. ポイントシステム</h2>
            </div>
            <div className="space-y-6 text-gray-700">
              <p className="text-lg font-medium">顧客アカウントが出来ると、全国フローリストマップに掲載されている花屋の全ての全国の店舗で、ご購入頂いた金額の<strong className="text-yellow-600">5%がポイント</strong>として貯まり、次回以降に使用出来るようになります。</p>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                <h3 className="font-semibold mb-3 text-yellow-800">ポイント使用について：</h3>
                <ul className="list-disc list-inside space-y-2 text-yellow-700">
                  <li>使用限度額は一度の<strong>1500ポイント程度</strong></li>
                  <li><strong>1ポイント1円</strong>に対する金額としてお使いできます</li>
                  <li>交換できるものは店舗により異なります。ご確認ください</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
                <h3 className="font-semibold mb-3 text-red-800">⚠️ ポイント使用制限期間：</h3>
                <p className="text-red-700">母の日前、年末前、クリスマス前の<strong>1週間は使用できません</strong>のでご注意ください。</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-gray-800">ベーシック</h3>
                  <p className="text-sm text-gray-600">0-99ポイント</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{width: '25%'}}></div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-blue-800">レギュラー</h3>
                  <p className="text-sm text-blue-600">100-499ポイント</p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{width: '50%'}}></div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-purple-800">プロ</h3>
                  <p className="text-sm text-purple-600">500-999ポイント</p>
                  <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                    <div className="bg-purple-400 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-yellow-800">エキスパート</h3>
                  <p className="text-sm text-yellow-600">1000ポイント以上</p>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
              
              <p className="text-lg font-medium text-gray-800">ポイントを貯めるとレベルが上がっていきます。年間での特典も考えています。ぜひレベルアップに挑戦してみてください。</p>
            </div>
          </div>

          {/* 全国お花贈り */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">3. 全国へのお花贈り</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-medium">全国へのお花贈りにも、お届け先のご住所のお近くの掲載店舗のSNSなどの画像を確認の上、メールや電話でお問い合わせください。</p>
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-6 border border-pink-200">
                <h3 className="font-semibold mb-3 text-pink-800">お花贈りの流れ：</h3>
                <ul className="list-disc list-inside space-y-2 text-pink-700">
                  <li>お届け先住所のお近くの店舗を確認</li>
                  <li>店舗のSNS画像を確認</li>
                  <li>メールや電話で直接お問い合わせ</li>
                  <li>上記1週間前までの発注でしたら、ポイント使用も可能かもしれません</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-800">決済について：</h3>
                <p className="text-blue-700">店舗先からのメールでクレジット決済のURLが届きますのでお支払いください。<strong>決済が完了しないとお花をお届けできません。</strong></p>
              </div>
            </div>
          </div>

          {/* マイ顧客コード */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">4. マイ顧客コード</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-medium">マイ顧客コードでは、ご自身の顧客アカウントデータやポイントなどの情報がデータベースに組み込まれ、アルファベットと数字に置き換えられ作られます。</p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-800">店舗での使用方法：</h3>
                <p className="text-blue-700 mb-3">小売店舗で残ポイントの掲示を求められると思いますので、見せていくつのポイントをその時に使うか直接口頭でお話しください。</p>
                <p className="text-blue-700">また、レッスン教室では先生に顧客コードを登録してもらうと、その先生のレッスンのスケジュールがスケジュール管理に反映されます。複数の教室の登録も可能です。</p>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold mb-3 text-gray-800">データ管理：</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>支払い決済のデータは決済履歴に反映</li>
                  <li>ポイントデータはポイント履歴に反映</li>
                </ul>
              </div>
            </div>
          </div>

          {/* フラワーレッスン */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">5. フラワーレッスン</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-medium">フラワーレッスンマップでは、地域ごとのフラワースクールが登録されています。興味のある方は詳細を見て、メールにて直接お問い合わせ、体験レッスンなどをしてみてください。</p>
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
                <h3 className="font-semibold mb-3 text-purple-800">レッスンについて：</h3>
                <ul className="list-disc list-inside space-y-2 text-purple-700">
                  <li>ご自宅などでレッスンをされている方も多いので、住所の詳細は明記しておりません</li>
                  <li>継続でレッスンを行いたい場合は、マイ顧客コードを先生に見せ登録してもらう</li>
                  <li>レッスンスケジュール管理のページに、次回以降のレッスンが見れるようになります</li>
                  <li>ご自身のご都合の良いレッスン日を選択し登録してください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 人気ランキング */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">6. 人気ランキング</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-medium">人気ランキングは、全国の地域の人気の花を月単位で見ることができます。ぜひお楽しみください。</p>
            </div>
          </div>

          {/* 決済について */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">7. 決済について</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-medium">支払いは現金やクレジットなどの決済になります。店舗にお伝えください。</p>
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
                <h3 className="font-semibold mb-3 text-green-800">重要なお知らせ：</h3>
                <p className="text-green-700">またクレジットデータは運営は取っておりません。データベースはより良いお花を愛する方々と、花業界の発展のために使われます。管理には徹底した配慮をいたしますが、何かございましたら <strong>deblwinkel@gmail.com</strong> までご連絡ください。</p>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-4">87app</h2>
              <p className="text-lg opacity-90">お花が好きな人のためのアプリ</p>
              <p className="text-sm opacity-75 mt-4">より良いお花ライフをお楽しみください</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
