import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONSリクエストの処理（プリフライト）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      amount,                    // 顧客が手動で入力した決済金額（必須）
      currency = 'jpy', 
      product_id,                // 事前に作成した商品ID（オプション）
      product_name,              // 商品名（product_idがない場合に使用）
      metadata                   // メタデータ（store_id, customer_id等を含む）
    } = req.body;

    // 環境変数のチェック
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEYが設定されていません');
      return res.status(500).json({ error: 'Stripe設定エラー: STRIPE_SECRET_KEYが設定されていません' });
    }

    // 必須パラメータのチェック
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '決済金額（amount）は必須で、0より大きい値である必要があります' });
    }

    if (!metadata || !metadata.store_id) {
      return res.status(400).json({ error: 'store_idがメタデータに含まれている必要があります' });
    }

    // amountがセント単位か確認（JPYの場合は整数でOK）
    const amountInSmallestUnit = Math.round(amount);

    console.log('Stripe決済Intent作成開始（運営側アカウント）:', {
      amount,
      amountInSmallestUnit,
      currency,
      product_id,
      product_name,
      metadata
    });

    // 商品情報を準備
    let lineItem = {};
    if (product_id) {
      // 事前に作成した商品IDを使用（価格は動的に設定）
      lineItem = {
        price_data: {
          currency: currency,
          product: product_id,
          unit_amount: amountInSmallestUnit, // 顧客が手動で入力した金額（最小単位）
        },
        quantity: 1,
      };
    } else {
      // 動的に商品データと価格を作成
      lineItem = {
        price_data: {
          currency: currency,
          product_data: {
            name: product_name || metadata?.store_name || '花屋でのお買い物',
            description: metadata?.description || '87app経由での決済',
            metadata: {
              ...metadata,
              created_via: '87app',
              created_at: new Date().toISOString()
            }
          },
          unit_amount: amountInSmallestUnit, // 顧客が手動で入力した金額（最小単位）
        },
        quantity: 1,
      };
    }

    // ベースURLを取得（環境変数またはデフォルト値）
    // 本番環境ではVercelのURLを自動検出
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || process.env.VITE_BASE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || (req.headers.host ? `https://${req.headers.host}` : null)
      || 'http://localhost:5173';

    // Checkout Sessionを作成（運営側のStripeアカウントで）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'payment',
      success_url: `${baseUrl}/payment-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dynamic-stripe-checkout?canceled=true`,
      payment_intent_data: {
        metadata: {
          ...metadata,
          amount: amount.toString(),
          currency: currency,
          created_via: '87app',
          store_id: metadata.store_id // 店舗IDを明示的に保存
        },
      },
    });
    // 注意: stripeAccountは指定しない（運営側のアカウントで決済）

    console.log('Checkout Session作成成功（運営側アカウント）:', {
      sessionId: session.id,
      url: session.url,
      store_id: metadata.store_id
    });

    // Checkout SessionのURLを返す
    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url, // Checkout SessionのURL
      payment_intent_id: session.payment_intent,
    });

  } catch (error) {
    console.error('Stripe Connect決済Intent作成エラー:', error);
    console.error('エラー詳細:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw
    });
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      errorType: error.type || 'Unknown',
      errorCode: error.code || 'unknown',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
