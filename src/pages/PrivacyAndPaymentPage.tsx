import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CreditCard, Lock, Database, Eye, FileText, Mail } from 'lucide-react';

// 背景画像（花屋店舗内）
const BG_IMAGE = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

export const PrivacyAndPaymentPage: React.FC = () => {
  const navigate = useNavigate();

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
              個人データ保護と決済
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
            style={{ backgroundColor: 'rgba(92,107,74,0.95)' }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(250,248,245,0.15)' }}
            >
              <Shield className="w-8 h-8" style={{ color: '#FAF8F5' }} />
            </div>
            <h1 
              className="text-2xl md:text-3xl mb-2"
              style={{ fontFamily: "'Noto Serif JP', serif", color: '#FAF8F5' }}
            >
              個人データ保護と決済
            </h1>
            <p style={{ color: 'rgba(250,248,245,0.8)' }}>
              お客様の個人情報と決済データの保護に関する重要な情報
            </p>
          </div>

          {/* セクション1: 個人データの保護 */}
          <div 
            className="rounded-sm p-6 md:p-8"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #E0D6C8' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F5F0E8' }}
              >
                <Lock className="w-6 h-6" style={{ color: '#5C6B4A' }} />
              </div>
              <h2 
                className="text-xl"
                style={{ fontFamily: "'Noto Serif JP', serif", color: '#2D2A26' }}
              >
                1. 個人データの保護
              </h2>
            </div>

            <p className="text-sm mb-6" style={{ color: '#5A5651' }}>
              87appでは、お客様の個人情報を適切に保護することを最優先に考えています。
            </p>

            <div className="space-y-4">
              {/* データの収集と管理 */}
              <div className="rounded-sm p-5" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <h3 className="font-medium" style={{ color: '#5C6B4A' }}>データの収集と管理</h3>
                </div>
                <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
                  <li>• お客様から収集する情報は、サービス提供に必要な最小限の情報のみです</li>
                  <li>• お名前、メールアドレス、住所、電話番号、誕生日などの基本情報を登録いただきます</li>
                  <li>• ポイントデータや購入履歴などの利用情報も安全に管理いたします</li>
                  <li>• すべてのデータは暗号化されたデータベースに保存されます</li>
                </ul>
              </div>

              {/* セキュリティ対策 */}
              <div className="rounded-sm p-5" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <h3 className="font-medium" style={{ color: '#5C6B4A' }}>セキュリティ対策</h3>
                </div>
                <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
                  <li>• SSL/TLS暗号化通信により、データの送受信を保護しています</li>
                  <li>• 定期的なセキュリティ監査と更新を実施しています</li>
                  <li>• アクセス制御により、許可された担当者のみがデータにアクセスできます</li>
                  <li>• 個人情報の漏洩防止のため、厳格な管理基準を設けています</li>
                </ul>
              </div>

              {/* データの利用目的 */}
              <div className="rounded-sm p-5" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <h3 className="font-medium" style={{ color: '#5C6B4A' }}>データの利用目的</h3>
                </div>
                <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
                  <li>• サービス提供（ポイント管理、決済処理、レッスン予約など）</li>
                  <li>• お客様への通知やお知らせの送信</li>
                  <li>• サービス改善のための統計分析（個人を特定できない形で）</li>
                  <li>• 法的義務の履行（税務処理など）</li>
                </ul>
                <p className="mt-3 text-xs font-medium" style={{ color: '#5C6B4A' }}>
                  ※ お客様の同意なく、第三者に個人情報を提供することはありません
                </p>
              </div>

              {/* お客様の権利 */}
              <div className="rounded-sm p-5" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5" style={{ color: '#5C6B4A' }} />
                  <h3 className="font-medium" style={{ color: '#5C6B4A' }}>お客様の権利</h3>
                </div>
                <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
                  <li>• ご自身の個人情報の確認、修正、削除を要求することができます</li>
                  <li>• データの利用停止を要求することができます</li>
                  <li>• 個人情報の取り扱いに関するお問い合わせは、マイプロフィールページから可能です</li>
                  <li>• データに関するご質問やご要望は、deblwinkel@gmail.com までご連絡ください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* セクション2: Stripe決済について */}
          <div 
            className="rounded-sm p-6 md:p-8"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #E0D6C8' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F5F0E8' }}
              >
                <CreditCard className="w-6 h-6" style={{ color: '#5C6B4A' }} />
              </div>
              <h2 
                className="text-xl"
                style={{ fontFamily: "'Noto Serif JP', serif", color: '#2D2A26' }}
              >
                2. Stripe決済について
              </h2>
            </div>

            <p className="text-sm mb-6" style={{ color: '#5A5651' }}>
              87appでは、世界的に信頼されている決済サービス「Stripe」を使用して、安全にクレジットカード決済を処理しています。
            </p>

            <div className="space-y-4">
              {/* Stripeとは */}
              <div className="rounded-sm p-5" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}>
                <h3 className="font-medium mb-3" style={{ color: '#5C6B4A' }}>Stripeとは</h3>
                <p className="text-sm mb-3" style={{ color: '#5A5651' }}>
                  Stripeは、世界中の数百万の企業が使用している決済処理プラットフォームです。Apple、Amazon、Googleなどの大手企業も採用している、業界最高水準のセキュリティ基準を満たしたサービスです。
                </p>
                <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
                  <li>• PCI DSS Level 1認証を取得（最高レベルのセキュリティ基準）</li>
                  <li>• カード情報は当社のサーバーを経由せず、直接Stripeに送信されます</li>
                  <li>• 暗号化された通信により、データが保護されます</li>
                </ul>
              </div>

              {/* 決済データの取り扱い */}
              <div className="rounded-sm p-5" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}>
                <h3 className="font-medium mb-3" style={{ color: '#5C6B4A' }}>決済データの取り扱い</h3>
                <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
                  <li>• <strong>87appはクレジットカード情報を保持しません</strong></li>
                  <li>• カード番号、有効期限、セキュリティコードなどの機密情報は、すべてStripeが管理します</li>
                  <li>• 当社が保存するのは、決済が完了したことを示すトランザクションIDのみです</li>
                  <li>• カード情報の保存は、お客様の明示的な同意がある場合のみ、Stripe側で暗号化して保存されます</li>
                </ul>
              </div>

              {/* 決済履歴とデータ利用 */}
              <div className="rounded-sm p-5" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E0D6C8' }}>
                <h3 className="font-medium mb-3" style={{ color: '#5C6B4A' }}>決済履歴とデータ利用</h3>
                <ul className="space-y-2 text-sm" style={{ color: '#5A5651' }}>
                  <li>• 決済金額、日時、店舗情報などの取引データは、決済履歴ページで確認できます</li>
                  <li>• これらのデータは、ポイント計算やサービス改善のために使用されます</li>
                  <li>• カード情報を含む機密データは一切保存されません</li>
                  <li>• データベースは、より良いお花を愛する方々と、花業界の発展のために使われます</li>
                </ul>
              </div>

              {/* 重要な注意事項 */}
              <div className="rounded-sm p-5" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                <h3 className="font-medium mb-3" style={{ color: '#DC2626' }}>⚠️ 重要な注意事項</h3>
                <ul className="space-y-2 text-sm" style={{ color: '#B91C1C' }}>
                  <li>• クレジットカード情報は当社のサーバーを経由しません</li>
                  <li>• 決済処理はすべてStripeの安全な環境で行われます</li>
                  <li>• 万が一、不正利用の疑いがある場合は、すぐにカード会社にお問い合わせください</li>
                  <li>• 問題が発生した場合は、deblwinkel@gmail.com までご連絡ください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* お問い合わせ */}
          <div 
            className="rounded-sm p-8 text-center"
            style={{ backgroundColor: 'rgba(92,107,74,0.95)' }}
          >
            <Mail className="w-8 h-8 mx-auto mb-4" style={{ color: '#FAF8F5' }} />
            <h2 
              className="text-xl mb-2"
              style={{ fontFamily: "'Noto Serif JP', serif", color: '#FAF8F5' }}
            >
              ご質問・ご相談
            </h2>
            <p className="text-sm mb-4" style={{ color: 'rgba(250,248,245,0.8)' }}>
              個人データ保護や決済に関するご質問・ご相談がございましたら、お気軽にお問い合わせください。
            </p>
            <p style={{ color: '#FAF8F5' }}>
              メール: <strong>deblwinkel@gmail.com</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
