import Stripe from 'stripe';

// Stripeインスタンスを取得する関数（エラーハンドリング付き）
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  // Stripeインスタンスにデフォルトのタイムアウトとリトライ設定を追加
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    timeout: 30000, // 30秒のタイムアウト
    maxNetworkRetries: 3, // 最大3回リトライ
    apiVersion: '2024-12-18.acacia', // 最新のAPIバージョンを使用
  });
}

/**
 * Stripe Connect Standard連結アカウント用の決済Intent作成
 * Direct Chargesモデルを使用
 * 
 * 資金と手数料の流れ:
 * 1. 顧客の決済: 購入者がクレジットカード等で決済を行います
 * 2. 売上の計上: その決済は販売側（連結アカウント）のStripeアカウントの売上として計上されます
 * 3. 手数料の差し引き: その売上から、以下の2種類の手数料が自動的に差し引かれます
 *    - Stripe決済手数料: Stripeを利用するための基本手数料（例: 日本国内カードなら3.6%）
 *    - プラットフォーム手数料（Application Fee）: 運営側が設定した独自の仲介手数料
 * 4. 振込: 手数料が引かれた後の残りの金額が、販売側の銀行口座へStripeから直接振り込まれます
 * 
 * 運営側（あなた）の収益:
 * 運営側には、上記ステップ3で差し引かれた「プラットフォーム手数料」のみが、運営側のStripeアカウント残高に積み上がります
 */
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
    // デバッグ: 環境変数の確認
    console.log('環境変数確認:', {
      STRIPE_SECRET_KEY_exists: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_SECRET_KEY_length: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0,
      STRIPE_SECRET_KEY_prefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'undefined',
    });

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
      console.error('STRIPE_SECRET_KEYの形式が正しくありません');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(500).json({ 
        error: 'Stripe設定エラー: STRIPE_SECRET_KEYの形式が正しくありません',
        details: 'STRIPE_SECRET_KEYはsk_test_またはsk_live_で始まる必要があります',
        help: 'https://dashboard.stripe.com/apikeys',
        success: false
      });
    }

    stripe = getStripe();
    console.log('Stripe初期化成功');
  } catch (initError) {
    console.error('Stripe初期化エラー:', initError);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(500).json({ 
      error: 'Stripe設定エラー: Stripeの初期化に失敗しました',
      details: initError.message || 'STRIPE_SECRET_KEYが設定されているか確認してください',
      help: 'https://vercel.com/bloemisms-projects/customers/settings/environment-variables',
      success: false
    });
  }

  try {
    // リクエストボディをログ出力（デバッグ用）
    console.log('リクエストボディ:', JSON.stringify(req.body, null, 2));

    const { 
      amount,                    // 決済金額（必須、セント単位）
      currency = 'jpy', 
      connected_account_id,      // Stripe Connect連結アカウントID（必須）
      application_fee_amount,   // プラットフォーム手数料（セント単位、必須）
      product_name,              // 商品名
      items,                     // 品目情報（オプション）
      metadata,                  // メタデータ
    } = req.body;

    // 必須パラメータのチェック
    if (!amount || amount <= 0) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(400).json({ 
        error: '決済金額（amount）は必須で、0より大きい値である必要があります',
        success: false
      });
    }

    if (!connected_account_id) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(400).json({ 
        error: 'Stripe Connect連結アカウントID（connected_account_id）は必須です',
        success: false
      });
    }

    if (!application_fee_amount || application_fee_amount < 0) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(400).json({ 
        error: 'プラットフォーム手数料（application_fee_amount）は必須で、0以上の値である必要があります',
        success: false
      });
    }

    // 金額がセント単位か確認（JPYの場合は整数でOK）
    const amountInSmallestUnit = Math.round(amount);
    const applicationFeeInSmallestUnit = Math.round(application_fee_amount);

    // 連結アカウントの状態を確認（制限チェック）
    console.log('連結アカウントの状態を確認中:', connected_account_id);
    let account;
    try {
      account = await stripe.accounts.retrieve(connected_account_id);
      
      console.log('連結アカウント情報:', {
        id: account.id,
        type: account.type,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        capabilities: account.capabilities,
        restrictions: account.restrictions ? Object.keys(account.restrictions) : 'none'
      });

      // アカウントの制限をチェック
      if (account.restrictions && Object.keys(account.restrictions).length > 0) {
        console.warn('⚠️ 連結アカウントに制限があります:', account.restrictions);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(400).json({
          error: '連結アカウントに制限がかかっています',
          details: account.restrictions,
          account_id: account.id,
          account_type: account.type,
          charges_enabled: account.charges_enabled,
          help: 'Stripe Dashboardで連結アカウントの制限を解除してください。制限がある場合、Direct Chargesは使用できません。'
        });
      }

      // 決済が有効かチェック
      if (!account.charges_enabled) {
        console.warn('⚠️ 連結アカウントで決済が有効になっていません');
        console.warn('アカウント詳細:', {
          id: account.id,
          type: account.type,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          requirements: account.requirements,
          capabilities: account.capabilities
        });
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(400).json({
          error: '連結アカウントで決済が有効になっていません',
          account_id: account.id,
          account_type: account.type,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          requirements: account.requirements ? {
            currently_due: account.requirements.currently_due,
            eventually_due: account.requirements.eventually_due,
            past_due: account.requirements.past_due,
            pending_verification: account.requirements.pending_verification
          } : null,
          help: 'オンボーディングを完了し、必要な情報を提供してください。オンボーディングリンクを作成するには、/create-account-link にアクセスしてください。'
        });
      }

      console.log('✅ 連結アカウントの状態確認完了 - 決済可能');
    } catch (accountError) {
      console.error('連結アカウントの状態確認エラー:', accountError);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(400).json({
        error: '連結アカウントの状態確認に失敗しました',
        details: accountError.message,
        account_id: connected_account_id,
        help: '連結アカウントIDが正しいか、またはアカウントが存在するか確認してください'
      });
    }

    console.log('Stripe Connect決済Intent作成開始（Direct Chargesモデル）:', {
      amount: amountInSmallestUnit,
      currency,
      connected_account_id,
      application_fee_amount: applicationFeeInSmallestUnit,
      product_name,
      account_type: account.type,
      charges_enabled: account.charges_enabled,
      metadata
    });

    // メタデータを統合
    const finalMetadata = {
      ...metadata,
      connected_account_id,
      application_fee_amount: applicationFeeInSmallestUnit.toString(),
      original_amount: amountInSmallestUnit.toString(),
      created_via: '87app-connect',
      created_at: new Date().toISOString()
    };

    // 商品情報を準備（品目ごとにline_itemを作成）
    let lineItems = [];
    
    if (items && Array.isArray(items) && items.length > 0) {
      // 品目ごとにline_itemを作成
      items.forEach((item) => {
        const itemName = item.name || item.item_name || '商品';
        const itemColor = item.color ? `（${item.color}）` : '';
        const quantity = item.quantity || 1;
        const unitPrice = Math.round((item.unit_price || item.price || 0));
        
        lineItems.push({
          price_data: {
            currency: currency,
            product_data: {
              name: `${itemName}${itemColor}`,
              description: `単価: ¥${unitPrice.toLocaleString()} x ${quantity}本`,
            },
            unit_amount: unitPrice, // 日本円（JPY）はそのまま円単位
          },
          quantity: quantity,
        });
      });
    } else {
      // 品目情報がない場合は、合計金額を1つのline_itemとして送信
      lineItems.push({
        price_data: {
          currency: currency,
          product_data: {
            name: product_name || 'お買い物',
            description: `合計金額: ¥${amountInSmallestUnit.toLocaleString()}`,
          },
          unit_amount: amountInSmallestUnit, // 日本円（JPY）はそのまま円単位
        },
        quantity: 1,
      });
    }

    // ベースURLを取得（環境変数またはデフォルト値）
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || process.env.VITE_BASE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || (req.headers.host ? `https://${req.headers.host}` : null)
      || 'http://localhost:5173';

    // Checkout Sessionを作成（Stripe Connect Direct Chargesモデル）
    console.log('Checkout Session作成開始（Stripe Connect）:', {
      baseUrl,
      amountInSmallestUnit,
      connected_account_id,
      application_fee_amount: applicationFeeInSmallestUnit,
      finalMetadata: {
        ...finalMetadata,
        items: finalMetadata.items ? 'items included' : 'no items'
      }
    });

    let session;
    try {
      // Stripe APIのタイムアウトとリトライ設定
      const stripeConfig = {
        timeout: 30000, // 30秒のタイムアウト
        maxNetworkRetries: 3, // 最大3回リトライ
      };

      console.log('Stripe Checkout Session作成開始（リトライ設定付き）:', {
        timeout: stripeConfig.timeout,
        maxNetworkRetries: stripeConfig.maxNetworkRetries
      });

      // Direct Chargesモデル: stripeAccountパラメータで連結アカウントを指定
      // application_fee_amountでプラットフォーム手数料を指定
      console.log('Checkout Session作成パラメータ:', {
        connected_account_id,
        application_fee_amount: applicationFeeInSmallestUnit,
        amount: amountInSmallestUnit,
        baseUrl
      });
      
      // Stripe API呼び出しオプション
      const requestOptions = {
        timeout: stripeConfig.timeout,
        maxNetworkRetries: stripeConfig.maxNetworkRetries,
      };
      
      // Direct Chargesモデル: stripeAccountを指定してCheckout Sessionを作成
      // 注意: stripeAccountは第2引数のオプションオブジェクトの最初のレベルに配置する必要がある
      const sessionParams = {
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: 'payment',
        success_url: `${baseUrl}/stripe-connect-payment-complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/stripe-connect-payment?canceled=true`,
        payment_intent_data: {
          application_fee_amount: applicationFeeInSmallestUnit, // プラットフォーム手数料
          metadata: finalMetadata,
        },
      };
      
      // Direct Chargesモデル: stripeAccountを指定してCheckout Sessionを作成
      // StandardアカウントでDirect Chargesを使用する場合、stripeAccountを第2引数に指定
      // 注意: Stripe SDK v17.7.0では、stripeAccountは正しくStripe-Accountヘッダーとして送信されるはずです
      
      console.log('Stripe Checkout Session作成（Direct Chargesモデル）:', {
        connected_account_id,
        amount: amountInSmallestUnit,
        application_fee_amount: applicationFeeInSmallestUnit,
        baseUrl,
        stripe_sdk_version: '17.7.0'
      });
      
      // Direct Chargesモデル: stripeAccountを第2引数に指定
      // StandardアカウントでDirect Chargesを使用する場合、stripeAccountを指定する必要があります
      // 注意: Stripe SDKが正しくStripe-Accountヘッダーを送信することを確認
      
      // デバッグ: 連結アカウントIDの形式を確認
      if (!connected_account_id.startsWith('acct_')) {
        throw new Error(`無効な連結アカウントID形式: ${connected_account_id}`);
      }
      
      console.log('Stripe API呼び出し詳細:', {
        connected_account_id,
        account_id_length: connected_account_id.length,
        account_id_prefix: connected_account_id.substring(0, 8),
        application_fee_amount: applicationFeeInSmallestUnit,
        amount: amountInSmallestUnit
      });
      
      // Direct Chargesモデル: stripeAccountを第2引数に指定
      // StandardアカウントでDirect Chargesを使用する場合、stripeAccountを指定する必要があります
      // 注意: 連結アカウントに制限がある場合、Direct Chargesは使用できません
      
      console.log('Direct ChargesモデルでCheckout Sessionを作成:', {
        connected_account_id,
        account_type: account.type,
        charges_enabled: account.charges_enabled,
        restrictions: account.restrictions ? Object.keys(account.restrictions) : 'none',
        amount: amountInSmallestUnit,
        application_fee_amount: applicationFeeInSmallestUnit,
        baseUrl
      });
      
      // 連結アカウントに制限がある場合、エラーを返す
      if (account.restrictions && Object.keys(account.restrictions).length > 0) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(400).json({
          error: '連結アカウントに制限がかかっているため、Direct Chargesは使用できません',
          details: account.restrictions,
          account_id: account.id,
          account_type: account.type,
          charges_enabled: account.charges_enabled,
          help: 'Stripe Dashboardで連結アカウントの制限を解除してください。制限がある場合、Direct Chargesは使用できません。'
        });
      }
      
      try {
        // Direct Chargesモデル: stripeAccountを第2引数に指定
        // 注意: 連結アカウントに制限がある場合、この方法は動作しません
        session = await stripe.checkout.sessions.create(
          {
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${baseUrl}/stripe-connect-payment-complete?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/stripe-connect-payment?canceled=true`,
            payment_intent_data: {
              application_fee_amount: applicationFeeInSmallestUnit, // プラットフォーム手数料
              metadata: finalMetadata,
            },
          },
          {
            stripeAccount: connected_account_id, // 連結アカウントIDを指定（Direct Charges）- 必須
            timeout: stripeConfig.timeout,
            maxNetworkRetries: stripeConfig.maxNetworkRetries,
          }
        );
      } catch (createError) {
        // より詳細なエラー情報をログに記録
        console.error('Stripe Checkout Session作成エラー詳細:', {
          error_type: createError.type,
          error_code: createError.code,
          error_message: createError.message,
          error_statusCode: createError.statusCode,
          error_requestId: createError.requestId,
          connected_account_id,
          application_fee_amount: applicationFeeInSmallestUnit
        });
        throw createError;
      }

      console.log('Checkout Session作成成功（Stripe Connect）:', {
        sessionId: session.id,
        url: session.url,
        connected_account_id
      });

    } catch (stripeError) {
      console.error('Stripe Checkout Session作成エラー:', stripeError);
      console.error('Stripeエラー詳細:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        statusCode: stripeError.statusCode,
        raw: stripeError.raw,
        requestId: stripeError.requestId,
      });

      // 接続エラーの場合、より詳細なメッセージを返す
      let errorMessage = stripeError.message || 'Stripe APIへの接続エラーが発生しました';
      if (stripeError.message && stripeError.message.includes('connection')) {
        errorMessage = 'Stripe APIへの接続に失敗しました。しばらく待ってから再度お試しください。';
      } else if (stripeError.message && stripeError.message.includes('retried')) {
        errorMessage = 'Stripe APIへの接続がタイムアウトしました。ネットワーク接続を確認してください。';
      } else if (stripeError.code === 'account_invalid') {
        errorMessage = 'Stripe Connect連結アカウントが無効です。連結アカウントIDを確認してください。';
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(500).json({
        error: errorMessage,
        errorType: stripeError.type || 'StripeAPIError',
        errorCode: stripeError.code || 'connection_error',
        requestId: stripeError.requestId || undefined,
        success: false,
        retryable: true,
        help: 'しばらく待ってから再度お試しください。問題が続く場合は、ネットワーク接続を確認してください。'
      });
    }

    // Checkout SessionのURLを返す
    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url, // Checkout SessionのURL
      payment_intent_id: session.payment_intent,
      connected_account_id,
      application_fee_amount: applicationFeeInSmallestUnit,
      amount: amountInSmallestUnit,
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

