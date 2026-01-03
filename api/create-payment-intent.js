import Stripe from 'stripe';

// Stripeインスタンスを取得する関数（エラーハンドリング付き）
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Stripeの初期化
  let stripe;
  try {
    // 環境変数の存在確認
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEYが設定されていません');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(500).json({ 
        error: 'Stripe設定エラー: STRIPE_SECRET_KEYが設定されていません',
        details: 'Vercel Dashboardで環境変数STRIPE_SECRET_KEYを設定してください',
        help: 'https://vercel.com/bloemisms-projects/customers/settings/environment-variables',
        success: false
      });
    }

    // Stripeキーの形式確認（sk_test_またはsk_live_で始まる必要がある）
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      console.error('STRIPE_SECRET_KEYの形式が正しくありません:', secretKey.substring(0, 10) + '...');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(500).json({ 
        error: 'Stripe設定エラー: STRIPE_SECRET_KEYの形式が正しくありません',
        details: 'STRIPE_SECRET_KEYはsk_test_またはsk_live_で始まる必要があります',
        help: 'Stripe Dashboardから正しいSecret Keyを取得してください: https://dashboard.stripe.com/apikeys',
        success: false
      });
    }

    stripe = getStripe();
    console.log('Stripe初期化成功');
  } catch (initError) {
    console.error('Stripe初期化エラー:', initError);
    console.error('エラースタック:', initError.stack);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(500).json({ 
      error: 'Stripe設定エラー: Stripeの初期化に失敗しました',
      details: initError.message || 'STRIPE_SECRET_KEYが設定されているか確認してください',
      errorType: initError.name || 'Unknown',
      help: 'Vercel Dashboardで環境変数を確認してください: https://vercel.com/bloemisms-projects/customers/settings/environment-variables',
      success: false
    });
  }

  try {
    // リクエストボディをログ出力（デバッグ用）
    console.log('リクエストボディ:', JSON.stringify(req.body, null, 2));

    const { 
      amount,                    // 顧客が手動で入力した決済金額（必須）
      currency = 'jpy', 
      product_id,                // 事前に作成した商品ID（オプション）
      product_name,              // 商品名（product_idがない場合に使用）
      metadata,                  // メタデータ（store_id, customer_id等を含む）
      store_id,                  // 店舗ID（直接指定も可能）
      store_name,                // 店舗名（直接指定も可能）
      customer_id,               // 顧客ID（直接指定も可能）
      points_to_use,             // 使用ポイント（直接指定も可能）
      items                      // 商品情報（直接指定も可能）
    } = req.body;

    // 環境変数のチェック（既に初期化時にチェック済みだが、念のため再確認）
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEYが設定されていません');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(500).json({ 
        error: 'Stripe設定エラー: STRIPE_SECRET_KEYが設定されていません',
        details: 'Vercelの環境変数でSTRIPE_SECRET_KEYを設定してください'
      });
    }

    // 必須パラメータのチェック
    if (!amount || amount <= 0) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(400).json({ error: '決済金額（amount）は必須で、0より大きい値である必要があります' });
    }

    // store_idの取得（metadataまたは直接指定）
    const finalStoreId = store_id || metadata?.store_id;
    if (!finalStoreId) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(400).json({ error: 'store_idが必要です（metadataまたは直接指定）' });
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

    // メタデータを統合（直接指定された値を優先）
    const finalMetadata = {
      ...metadata,
      store_id: finalStoreId,
      store_name: store_name || metadata?.store_name || '不明な店舗',
      customer_id: customer_id || metadata?.customer_id || '',
      points_used: (points_to_use || metadata?.points_used || 0).toString(),
      original_amount: amount.toString(),
      items: items ? JSON.stringify(items) : (metadata?.items ? JSON.stringify(metadata.items) : '[]'),
      created_via: '87app',
      created_at: new Date().toISOString()
    };

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
            name: product_name || finalMetadata.store_name || '花屋でのお買い物',
            description: metadata?.description || '87app経由での決済',
            metadata: finalMetadata
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
    console.log('Checkout Session作成開始:', {
      baseUrl,
      amountInSmallestUnit,
      finalStoreId,
      finalMetadata: {
        ...finalMetadata,
        items: finalMetadata.items ? 'items included' : 'no items'
      }
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: 'payment',
        success_url: `${baseUrl}/payment-complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dynamic-stripe-checkout?canceled=true`,
        payment_intent_data: {
          metadata: finalMetadata,
        },
      });
      // 注意: stripeAccountは指定しない（運営側のアカウントで決済）
    } catch (stripeError) {
      console.error('Stripe Checkout Session作成エラー:', stripeError);
      console.error('Stripeエラー詳細:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        statusCode: stripeError.statusCode,
        raw: stripeError.raw
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(500).json({
        error: `Stripe Checkout Session作成エラー: ${stripeError.message}`,
        errorType: stripeError.type || 'Unknown',
        errorCode: stripeError.code || 'unknown',
        success: false
      });
    }

    console.log('Checkout Session作成成功（運営側アカウント）:', {
      sessionId: session.id,
      url: session.url,
      store_id: finalStoreId
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
      raw: error.raw,
      stack: error.stack
    });
    
    // CORSヘッダーをエラーレスポンスにも追加
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      errorType: error.type || 'Unknown',
      errorCode: error.code || 'unknown',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
