import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 環境変数の取得（VercelではVITE_プレフィックスは使えない）
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://aoqmdyapjsmmvjrwfdup.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NjY1MCwiZXhwIjoyMDcwNTcyNjUwfQ.v8vniAL-aYfmFZgVDfBa6q_RoTrvmE_uXQjQweLiui8';

// Stripeクライアントの初期化（環境変数チェック付き）
if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY環境変数が設定されていません');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 手数料計算
 */
const calculateFees = (amount) => {
  const platformFeeRate = 0.03; // 運営手数料 3%
  const stripeFeeRate = 0.036; // Stripe手数料 3.6%
  
  const platformFee = Math.round(amount * platformFeeRate);
  const stripeFee = Math.round(amount * stripeFeeRate);
  const storeAmount = amount - platformFee - stripeFee;
  
  return {
    total: amount,
    platformFee,
    stripeFee,
    storeAmount,
  };
};

export default async function handler(req, res) {
  // CORSヘッダーを設定（すべてのリクエストに対して）
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24時間

  // OPTIONSリクエスト（プリフライト）の処理
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 環境変数のチェック
  if (!stripe) {
    console.error('Stripeクライアントが初期化されていません。STRIPE_SECRET_KEYを確認してください。');
    return res.status(500).json({
      success: false,
      error: '決済システムの設定が不完全です。管理者に連絡してください。',
      details: 'STRIPE_SECRET_KEY環境変数が設定されていません'
    });
  }

  try {
    const { paymentCode, customerId } = req.body;

    if (!paymentCode || (paymentCode.length !== 5 && paymentCode.length !== 6)) {
      return res.status(400).json({ 
        success: false,
        error: '5桁または6桁の決済コードが必要です' 
      });
    }

    console.log('決済コード処理開始:', { paymentCode, customerId });

    // 1. 決済コードから決済情報を取得
    let codeData = null;
    let paymentData = null;
    let storeId = null;

    if (paymentCode.length === 5) {
      // 5桁コード: payment_codesテーブルから取得
      const { data, error } = await supabase
        .from('payment_codes')
        .select('*, payment_data')
        .eq('code', paymentCode)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: '無効な決済コードです。コードを確認してください。'
        });
      }

      codeData = data;
      paymentData = data.payment_data;
      storeId = data.store_id;
    } else if (paymentCode.length === 6) {
      // 6桁コード: remote_invoice_codesテーブルから取得
      // 注意: remote_invoice_codesにはpayment_dataがない可能性があるため、
      // 別の方法で決済情報を取得する必要がある場合があります
      const { data, error } = await supabase
        .from('remote_invoice_codes')
        .select('*')
        .eq('code', paymentCode)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: '無効な決済コードです。コードを確認してください。'
        });
      }

      codeData = data;
      storeId = data.store_id;
      
      // 6桁コードの場合は、payment_requestsテーブルから決済情報を取得する可能性がある
      // ここでは簡易的にstore_idから店舗情報を取得
      paymentData = {
        storeId: data.store_id,
        totalAmount: 0, // 6桁コードの場合は別途金額を取得する必要がある
      };
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: '店舗情報が見つかりません'
      });
    }

    // 2. 店舗情報とStripe Connected Accountを取得
    // カラム名のバリエーションに対応（stripe_account_id または stripe_connect_account_id）
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, store_name, name, stripe_account_id, stripe_connect_account_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled')
      .eq('id', storeId)
      .single();

    if (storeError || !storeData) {
      console.error('店舗情報取得エラー:', storeError);
      return res.status(404).json({
        success: false,
        error: '店舗情報が見つかりません',
        details: storeError?.message || 'Unknown error'
      });
    }

    // stripe_account_id または stripe_connect_account_id のいずれかを使用
    const stripeAccountId = storeData.stripe_account_id || storeData.stripe_connect_account_id;

    if (!stripeAccountId) {
      return res.status(400).json({
        success: false,
        error: 'この店舗はStripe Connectアカウントが設定されていません。店舗に連絡してください。'
      });
    }

    // stripe_charges_enabledがnullの場合はtrueとして扱う（後方互換性）
    if (storeData.stripe_charges_enabled === false) {
      return res.status(400).json({
        success: false,
        error: 'この店舗は決済を受け付ける準備ができていません。店舗に連絡してください。'
      });
    }

    // 3. 決済金額とポイント情報を取得（payment_dataから）
    // totalAmountは既にポイントを差し引いた後の金額
    // 金額は円単位で保存されているため、Stripe用にセント単位に変換
    let totalAmountYen = 0;
    let pointsUsed = 0;
    let originalAmount = 0; // ポイント差し引き前の金額
    
    if (paymentCode.length === 5 && paymentData) {
      // 5桁コード: payment_dataから取得
      totalAmountYen = parseInt(paymentData.totalAmount || paymentData.total || 0);
      pointsUsed = parseInt(paymentData.pointsUsed || paymentData.points_to_use || 0);
      
      // 元の金額を計算（ポイント差し引き前）
      // totalAmountが既にポイント差し引き後なので、pointsUsedを足す
      originalAmount = totalAmountYen + pointsUsed;
    } else if (paymentCode.length === 6) {
      // 6桁コード: remote_invoice_codesにはpayment_dataがないため、
      // payment_requestsテーブルから取得するか、別の方法で金額を取得
      // ここでは簡易的に、payment_requestsテーブルから取得を試みる
      const { data: paymentRequest } = await supabase
        .from('payment_requests')
        .select('total')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (paymentRequest) {
        totalAmountYen = paymentRequest.total || 0;
      } else {
        return res.status(400).json({
          success: false,
          error: '決済情報が見つかりません。店舗に連絡してください。'
        });
      }
    }
    
    if (totalAmountYen <= 0) {
      return res.status(400).json({
        success: false,
        error: '決済金額が無効です'
      });
    }

    // 4. 手数料を計算（円単位）
    const fees = calculateFees(totalAmountYen);

    console.log('決済情報:', {
      storeId,
      storeAccountId: stripeAccountId,
      totalAmountYen,
      fees
    });

    // 5. Stripe ConnectでCheckout Sessionを作成（Destination Charge方式）
    // 運営が手数料を取るため、application_fee_amountを使用
    // ベースURLの決定: VERCEL_URL > NEXT_PUBLIC_BASE_URL > 本番URL > ローカル
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL 
      ? process.env.NEXT_PUBLIC_BASE_URL
      : process.env.NODE_ENV === 'production'
      ? 'https://customers-three-rust.vercel.app'
      : 'http://localhost:5174';

    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `${storeData.store_name || storeData.name}でのお買い物`,
              description: `決済コード: ${paymentCode}`,
            },
            unit_amount: totalAmountYen * 100, // 円をセントに変換
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&payment_code=${paymentCode}`,
      cancel_url: `${baseUrl}/payment-cancel?payment_code=${paymentCode}`,
      payment_intent_data: {
        application_fee_amount: fees.platformFee * 100, // 運営手数料（セント単位）
        transfer_data: {
          destination: stripeAccountId, // 店舗のStripe Connected Account
        },
        metadata: {
          store_id: storeId,
          store_name: storeData.store_name || storeData.name,
          payment_code: paymentCode,
          customer_id: customerId || '',
          points_used: pointsUsed.toString(), // ポイント使用数をmetadataに含める
          original_amount: originalAmount.toString(), // ポイント差し引き前の金額
          final_amount: totalAmountYen.toString(), // ポイント差し引き後の金額（実際の決済金額）
          platform_fee: fees.platformFee.toString(),
          stripe_fee: fees.stripeFee.toString(),
          store_amount: fees.storeAmount.toString(),
          platform: 'bloemism-87app',
        },
      },
      metadata: {
        store_id: storeId,
        store_name: storeData.name,
        payment_code: paymentCode,
        customer_id: customerId || '',
        points_used: pointsUsed.toString(), // ポイント使用数をmetadataに含める
        original_amount: originalAmount.toString(), // ポイント差し引き前の金額
        final_amount: totalAmountYen.toString(), // ポイント差し引き後の金額（実際の決済金額）
        platform_fee: fees.platformFee.toString(),
        stripe_fee: fees.stripeFee.toString(),
        store_amount: fees.storeAmount.toString(),
        platform: 'bloemism-87app',
      },
      });
    } catch (stripeError) {
      console.error('Stripe Checkout Session作成エラー:', stripeError);
      return res.status(500).json({
        success: false,
        error: 'Stripe決済セッションの作成に失敗しました',
        details: stripeError.message || 'Unknown Stripe error',
        type: stripeError.type || 'Unknown'
      });
    }

    console.log('Checkout Session作成成功:', checkoutSession.id);

    // 6. 決済トランザクションをデータベースに記録（pending状態）
    // Payment Intent IDは後でWebhookで更新される
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        store_id: storeId,
        customer_id: customerId || null,
        payment_code: paymentCode,
        stripe_payment_intent_id: null, // Checkout Sessionから作成されるため、後で更新
        amount: totalAmountYen,
        currency: 'jpy',
        platform_fee: fees.platformFee,
        stripe_fee: fees.stripeFee,
        store_amount: fees.storeAmount,
        status: 'pending',
        payment_method: 'card',
        metadata: {
          checkout_session_id: checkoutSession.id,
          payment_data: paymentData,
          items: paymentData?.items || [], // 品目情報を含める
          fees: fees,
        },
      });

    if (transactionError) {
      console.error('決済トランザクション記録エラー:', transactionError);
      // エラーでも決済は続行
    }

    // 注意: 決済コードは決済完了後にWebhookで使用済みにマークする
    // ここではマークしない（決済がキャンセルされる可能性があるため）

    res.status(200).json({
      success: true,
      checkoutSessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url,
      amount: totalAmountYen,
      amountInCents: totalAmountYen * 100,
      fees: {
        platformFee: fees.platformFee,
        stripeFee: fees.stripeFee,
        storeAmount: fees.storeAmount,
      },
      store: {
        id: storeId,
        name: storeData.store_name || storeData.name,
      },
    });

  } catch (error) {
    console.error('決済コード処理エラー:', error);
    console.error('エラー詳細:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      stripeError: error.type || error.code || null
    });
    
    // エラーメッセージを詳細化
    let errorMessage = '決済の処理に失敗しました';
    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe APIエラー: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

