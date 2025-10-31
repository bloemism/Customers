import React from 'react';
import { ArrowLeft, Shield, CreditCard, Lock, Database, Eye, FileText, Mail } from 'lucide-react';

export const PrivacyAndPaymentPage: React.FC = () => {
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
            <h1 className="text-xl font-bold text-gray-900">個人データ保護と決済について</h1>
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
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">個人データ保護と決済について</h1>
              <p className="text-lg text-gray-600">
                お客様の個人情報と決済データの保護に関する重要な情報
              </p>
            </div>
          </div>

          {/* 個人データ保護 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">1. 個人データの保護</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-medium">87appでは、お客様の個人情報を適切に保護することを最優先に考えています。</p>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <h3 className="font-semibold mb-3 text-green-800 flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  データの収集と管理：
                </h3>
                <ul className="list-disc list-inside space-y-2 text-green-700">
                  <li>お客様から収集する情報は、サービス提供に必要な最小限の情報のみです</li>
                  <li>お名前、メールアドレス、住所、電話番号、誕生日などの基本情報を登録いただきます</li>
                  <li>ポイントデータや購入履歴などの利用情報も安全に管理いたします</li>
                  <li>すべてのデータは暗号化されたデータベースに保存されます</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-800 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  セキュリティ対策：
                </h3>
                <ul className="list-disc list-inside space-y-2 text-blue-700">
                  <li>SSL/TLS暗号化通信により、データの送受信を保護しています</li>
                  <li>定期的なセキュリティ監査と更新を実施しています</li>
                  <li>アクセス制御により、許可された担当者のみがデータにアクセスできます</li>
                  <li>個人情報の漏洩防止のため、厳格な管理基準を設けています</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
                <h3 className="font-semibold mb-3 text-purple-800 flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  データの利用目的：
                </h3>
                <ul className="list-disc list-inside space-y-2 text-purple-700">
                  <li>サービス提供（ポイント管理、決済処理、レッスン予約など）</li>
                  <li>お客様への通知やお知らせの送信</li>
                  <li>サービス改善のための統計分析（個人を特定できない形で）</li>
                  <li>法的義務の履行（税務処理など）</li>
                </ul>
                <p className="mt-3 text-sm text-purple-600 font-medium">
                  ※ お客様の同意なく、第三者に個人情報を提供することはありません
                </p>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                <h3 className="font-semibold mb-3 text-yellow-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  お客様の権利：
                </h3>
                <ul className="list-disc list-inside space-y-2 text-yellow-700">
                  <li>ご自身の個人情報の確認、修正、削除を要求することができます</li>
                  <li>データの利用停止を要求することができます</li>
                  <li>個人情報の取り扱いに関するお問い合わせは、マイプロフィールページから可能です</li>
                  <li>データに関するご質問やご要望は、<strong>deblwinkel@gmail.com</strong> までご連絡ください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stripe決済について */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">2. Stripe決済について</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-medium">87appでは、世界的に信頼されている決済サービス「Stripe」を使用して、安全にクレジットカード決済を処理しています。</p>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                <h3 className="font-semibold mb-3 text-indigo-800">Stripeとは：</h3>
                <p className="text-indigo-700 mb-3">
                  Stripeは、世界中の数百万の企業が使用している決済処理プラットフォームです。Apple、Amazon、Googleなどの大手企業も採用している、業界最高水準のセキュリティ基準を満たしたサービスです。
                </p>
                <ul className="list-disc list-inside space-y-2 text-indigo-700">
                  <li>PCI DSS Level 1認証を取得（最高レベルのセキュリティ基準）</li>
                  <li>カード情報は当社のサーバーを経由せず、直接Stripeに送信されます</li>
                  <li>暗号化された通信により、データが保護されます</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-800">決済データの取り扱い：</h3>
                <ul className="list-disc list-inside space-y-2 text-blue-700">
                  <li><strong>87appはクレジットカード情報を保持しません</strong></li>
                  <li>カード番号、有効期限、セキュリティコードなどの機密情報は、すべてStripeが管理します</li>
                  <li>当社が保存するのは、決済が完了したことを示すトランザクションIDのみです</li>
                  <li>カード情報の保存は、お客様の明示的な同意がある場合のみ、Stripe側で暗号化して保存されます</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
                <h3 className="font-semibold mb-3 text-green-800">決済履歴とデータ利用：</h3>
                <ul className="list-disc list-inside space-y-2 text-green-700">
                  <li>決済金額、日時、店舗情報などの取引データは、決済履歴ページで確認できます</li>
                  <li>これらのデータは、ポイント計算やサービス改善のために使用されます</li>
                  <li>カード情報を含む機密データは一切保存されません</li>
                  <li>データベースは、より良いお花を愛する方々と、花業界の発展のために使われます</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
                <h3 className="font-semibold mb-3 text-red-800">⚠️ 重要な注意事項：</h3>
                <ul className="list-disc list-inside space-y-2 text-red-700">
                  <li>クレジットカード情報は当社のサーバーを経由しません</li>
                  <li>決済処理はすべてStripeの安全な環境で行われます</li>
                  <li>万が一、不正利用の疑いがある場合は、すぐにカード会社にお問い合わせください</li>
                  <li>問題が発生した場合は、<strong>deblwinkel@gmail.com</strong> までご連絡ください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* お問い合わせ */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-4">ご質問・ご相談</h2>
              <p className="text-lg opacity-90 mb-4">
                個人データ保護や決済に関するご質問・ご相談がございましたら、お気軽にお問い合わせください。
              </p>
              <p className="text-lg font-medium">
                メール: <strong>deblwinkel@gmail.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

