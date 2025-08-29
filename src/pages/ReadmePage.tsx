import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flower, Star, MapPin, Calendar, CreditCard, QrCode, Mail, Phone } from 'lucide-react';

const ReadmePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="flex items-center text-green-600 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            メニューに戻る
          </Link>
        </div>

        {/* タイトル */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4">
            <Flower className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">87app 顧客向けアプリ</h1>
          <p className="text-lg text-gray-600">花屋でのお買い物をより楽しく、便利に</p>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Star className="w-6 h-6 mr-2 text-yellow-500" />
            アプリの使い方
          </h2>

          <div className="space-y-8">
            {/* アカウント登録 */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">1. アカウント登録</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  アカウント登録をしてログイン出来ましたら、マイプロフィールを設定しましょう。
                </p>
                <p className="text-gray-700 mb-3">
                  住所はプライバシー保護の観点から町名までの登録です。全てを必ず登録してください。
                </p>
              </div>
            </section>

            {/* ポイントシステム */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">2. ポイントシステム</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  顧客アカウントが出来るとそれに合わせて、全国フローリストマップに掲載されている花屋の全ての全国の店舗で、
                  ご購入頂いた金額の<strong className="text-green-600">5%</strong>がポイントと貯まり、次回以降に使用出来るようになります。
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                  <h4 className="font-semibold text-blue-800 mb-2">ポイント使用について</h4>
                  <ul className="text-blue-700 space-y-1 text-sm">
                    <li>• 使用限度額は一度の1500ポイント程度</li>
                    <li>• 1ポイント１円に対する金額としてお使いできます</li>
                    <li>• 交換できるものは店舗により異なります</li>
                    <li>• 母の日前、年末前、クリスマス前の１週間は使用できません</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 全国へのお花贈り */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                3. 全国へのお花贈り
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  全国へのお花贈りにも、お届け先のご住所のお近くの掲載店舗のSNSなどの画像を確認の上、
                  メールや電話でお問い合わせください。
                </p>
                <p className="text-gray-700">
                  上記１週間前までの発注でしたら、ポイント使用も可能かもしれません。店舗先にお聞きください。
                </p>
              </div>
            </section>

            {/* 決済について */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                4. 決済について
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  店舗先からのメールでクレジット決済のURLが届きますのでお支払いください。
                  決済が完了しないとお花をお届けできません。
                </p>
                <p className="text-gray-700">
                  支払い決済のデータは決済履歴、ポイントデータはポイント履歴に反映されます。
                </p>
              </div>
            </section>

            {/* マイQRコード */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <QrCode className="w-5 h-5 mr-2 text-purple-600" />
                5. マイQRコード
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  マイQRコードでは、ご自身の顧客アカウントデータやポイントなどの情報がQRコードで作られます。
                </p>
                <p className="text-gray-700">
                  店舗で残ポイントの掲示を求められると思いますので、見せていくつのポイントをその時に使うか直接口頭でお話しください。
                </p>
              </div>
            </section>

            {/* フラワーレッスン */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                6. フラワーレッスン
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  フラワーレッスンマップでは、地域ごとのフラワースクールが登録されています。
                  興味のある方は詳細を見て、メールにて直接お問い合わせ、体験レッスンなどをしてみてください。
                </p>
                <p className="text-gray-700 mb-3">
                  ご自宅などでレッスンをされている方も多いので、住所の詳細は明記しておりません。
                </p>
                <p className="text-gray-700">
                  もし、継続でレッスンを行いたい場合は、マイQRコードを先生に見せ登録してもらうと、
                  レッスンスケジュール管理のページに、次回以降のレッスンが見れるようになります。
                </p>
              </div>
            </section>

            {/* 人気ランキング */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">7. 人気ランキング</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  人気ランキングは、全国の地域の人気の花を月単位で見ることができます。
                  ぜひお楽しみください。
                </p>
                <p className="text-gray-700">
                  ポイントを貯めるとレベルが上がっていきます。年間での特典も考えています。
                  ぜひレベルアップに挑戦してみてください。
                </p>
              </div>
            </section>

            {/* データ保護 */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-red-600" />
                8. データ保護について
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  クレジットデータは運営は取っておりません。支払いは現金やクレジットなどの決済になります。
                  店舗にお伝えください。
                </p>
                <p className="text-gray-700 mb-3">
                  データベースはより良いお花を愛する方々と、花業界の発展のために使われます。
                  管理には徹底した配慮をいたしますが、何かございましたら
                  <a href="mailto:deblwinkel@gmail.com" className="text-blue-600 hover:text-blue-700">
                    deblwinkel@gmail.com
                  </a>
                  までご連絡ください。
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center text-gray-600">
          <p>87app - 花屋とお客様をつなぐプラットフォーム</p>
        </div>
      </div>
    </div>
  );
};

export default ReadmePage;
