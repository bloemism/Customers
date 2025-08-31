import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Store,
  GraduationCap,
  MapPin,
  Map,
  ShoppingCart,
  CreditCard,
  QrCode,
  TrendingUp,
  Users,
  Calendar,
  Shield,
  Mail,
  Phone,
  Globe,
  Instagram,
  ShoppingBag,
  Star,
  Navigation,
  Info,
  AlertTriangle
} from 'lucide-react';

export const ReadmePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/simple-menu')}
                className="p-2 text-white hover:text-blue-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Read me</h1>
                <p className="text-blue-100">87app 使い方・システム詳細・利用規約</p>
              </div>
            </div>
          </div>
        </div>

        {/* 目次 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Info className="w-6 h-6 mr-2 text-blue-500" />
            目次
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <a href="#account-setup" className="block text-blue-600 hover:text-blue-800">1. アカウント登録とプラン設定</a>
              <a href="#store-registration" className="block text-blue-600 hover:text-blue-800">2. 店舗・スクール登録</a>
              <a href="#point-system" className="block text-blue-600 hover:text-blue-800">3. ポイントシステム</a>
              <a href="#customer-app" className="block text-blue-600 hover:text-blue-800">4. お客様アプリの使い方</a>
            </div>
            <div className="space-y-2">
              <a href="#payment-system" className="block text-blue-600 hover:text-blue-800">5. 決済システム</a>
              <a href="#privacy" className="block text-blue-600 hover:text-blue-800">6. プライバシー保護</a>
              <a href="#contact" className="block text-blue-600 hover:text-blue-800">7. お問い合わせ</a>
              <a href="#terms" className="block text-blue-600 hover:text-blue-800">8. 利用規約</a>
            </div>
          </div>
        </div>

        {/* 1. アカウント登録とプラン設定 */}
        <div id="account-setup" className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-green-500" />
            1. アカウント登録とプラン設定
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              アカウント登録をしてログイン出来ましたら、お花屋さんなら店舗データ管理で「店舗登録」、
              フラワーレッスンの方はレッスンスクール管理で『スクール登録」を設定しましょう。
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 font-medium">
                💡 <strong>店舗でスクールをやられてる方は両方登録しましょう。</strong>
              </p>
            </div>
            <p>
              登録アカウントが出来るとそれに合わせて、<strong>フローリストプラン</strong>、<strong>フラワースクールプラン</strong>に分かれます
              （フローリストは両方使えます）。
            </p>
            <p>
              全国フローリストマップやフラワーレッスンマップに登録され、顧客側のアプリに表示されます。
            </p>
          </div>
        </div>

        {/* 2. 店舗・スクール登録 */}
        <div id="store-registration" className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Store className="w-6 h-6 mr-2 text-orange-500" />
            2. 店舗・スクール登録
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2 flex items-center">
                  <Store className="w-4 h-4 mr-2" />
                  店舗登録
                </h3>
                <ul className="space-y-2 text-sm text-orange-700">
                  <li>• 店舗名・住所・連絡先</li>
                  <li>• 営業時間・店舗タイプ</li>
                  <li>• 画像（最大5枚）</li>
                  <li>• 掲示板機能</li>
                  <li>• 銀行口座情報（必須）</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  スクール登録
                </h3>
                <ul className="space-y-2 text-sm text-purple-700">
                  <li>• スクール名・講師名</li>
                  <li>• 住所（町名まで）</li>
                  <li>• レッスン内容・料金</li>
                  <li>• 体験レッスン情報</li>
                  <li>• プライバシー保護対応</li>
                </ul>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ <strong>住所はスクールはプライバシー保護の観点から町名までの登録です。</strong>
                登録場所は全てを必ず登録してください。
              </p>
            </div>
          </div>
        </div>

        {/* 3. ポイントシステム */}
        <div id="point-system" className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Star className="w-6 h-6 mr-2 text-yellow-500" />
            3. ポイントシステム
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🎁 ポイント還元</h3>
              <p className="text-green-700">
                掲載されている花屋の全ての全国の店舗で、お客様のご購入頂いた金額の<strong>5%がポイント</strong>として貯まり、
                次回以降に使用出来るようになります。
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🔄 共通ポイント</h3>
              <p className="text-blue-700">
                他店で獲得したポイントも使える<strong>共通ポイント</strong>です。
                お客様の購入のメリットとリピートのことを考えたシステムです。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">💰 使用限度額</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 一度の1500ポイント程度</li>
                  <li>• 1ポイント = 1円</li>
                  <li>• 交換内容は店舗により異なる</li>
                </ul>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">🚫 使用制限期間</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• 母の日前1週間</li>
                  <li>• 年末前1週間</li>
                  <li>• クリスマス前1週間</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 4. お客様アプリの使い方 */}
        <div id="customer-app" className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <ShoppingBag className="w-6 h-6 mr-2 text-pink-500" />
            4. お客様アプリの使い方
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  全国フローリストマップ
                </h3>
                <p className="text-blue-700 text-sm">
                  全国へのお花贈りにも、お届け先のご住所のお近くの掲載店舗のSNSなどの画像を確認の上、
                  メールや電話でお問い合わせしていただきます。
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2 flex items-center">
                  <Map className="w-4 h-4 mr-2" />
                  フラワーレッスンマップ
                </h3>
                <p className="text-purple-700 text-sm">
                  地域ごとのフラワースクールが登録されています。興味のある方は詳細を見て、
                  メールにて直接お問い合わせ、体験レッスンといった流れになります。
                </p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📱 マイQRコード</h3>
              <p className="text-green-700">
                お客様側アプリにマイQRコードに、ご自身の顧客アカウントデータやポイントなどの情報がQRコードで作られます。
                それを見て残ポイントを確認ください（それを見て会計時にマイナスするポイントを口頭で確認ください）。
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">📅 レッスンスケジュール管理</h3>
              <p className="text-yellow-700">
                継続でレッスンを行いたい場合は、マイQRコードを先生に見せ登録してもらうと、
                レッスンスケジュール管理のページに、次回以降のレッスンが見れるようになります。
                ご自身のご都合の良いレッスン日を選択し登録してもらいます。
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-800 mb-2">🏆 人気ランキング</h3>
              <p className="text-indigo-700">
                全国の地域の人気の花を月単位で見ることができます。ぜひお楽しみください。
              </p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="font-semibold text-pink-800 mb-2">⭐ レベルシステム</h3>
              <p className="text-pink-700">
                ポイントを貯めるとレベルが上がるシステムになっています。QRコードに出るレベルを見て、
                お客様の花購入頻度がわかります。年間での特典も考えています。
              </p>
            </div>
          </div>
        </div>

        {/* 5. 決済システム */}
        <div id="payment-system" className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-green-500" />
            5. 決済システム
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">💳 クレジット決済</h3>
              <p className="text-green-700">
                店舗先からのメールでクレジット決済のURLをメールで送り決済してもらってください。
                決済が完了しないとお花をお届けできないよう説明してください。
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🏦 銀行口座</h3>
              <p className="text-blue-700">
                銀行口座は、お客様のクレジット決済の振り込みに使われます。<strong>必ず登録ください。</strong>
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">💵 現金決済</h3>
              <p className="text-orange-700">
                支払いは現金やクレジットなどの決済になります。お客様の判断によります。
                現金の場合もQRコードで必ず決済。お互いに通知があってからレジ打ち現金取引願います。
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-700">
                ⚠️ <strong>ポイントの取引データが有効になりません。</strong>
              </p>
            </div>
          </div>
        </div>

        {/* 6. プライバシー保護 */}
        <div id="privacy" className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-500" />
            6. プライバシー保護
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🏠 自宅レッスン</h3>
              <p className="text-blue-700">
                ご自宅などでレッスンをされている方も多いので、住所の詳細は明記しておりません。
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📊 データベース利用</h3>
              <p className="text-green-700">
                データベースはより良いお花を愛する方々と、花業界の発展のために使われます。
                管理には徹底した配慮をいたします。
              </p>
            </div>
          </div>
        </div>

        {/* 7. お問い合わせ */}
        <div id="contact" className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Mail className="w-6 h-6 mr-2 text-green-500" />
            7. お問い合わせ
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📧 サポートメール</h3>
              <p className="text-green-700">
                何かございましたら <strong>deblwinkel@gmail.com</strong> までご連絡ください。
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">💬 店舗との連絡</h3>
              <p className="text-blue-700">
                メール返信の上、お客様とご相談ください。
              </p>
            </div>
          </div>
        </div>

        {/* 8. 利用規約 */}
        <div id="terms" className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
            8. 利用規約・注意事項
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">📋 重要事項</h3>
              <ul className="text-orange-700 space-y-2">
                <li>• 上記1週間前までの発注でしたら、ポイント使用も可能か店舗でルールを決めてお客様とご相談ください</li>
                <li>• 支払い決済のデータは決済履歴、ポイントデータはポイント履歴に反映されます</li>
                <li>• 現金取引の場合もQRコードでの決済処理が必須です</li>
              </ul>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">87app</h3>
          <p className="text-gray-300">
            花業界の発展と、お花を愛する方々の幸せのために
          </p>
        </div>
      </div>
    </div>
  );
};
