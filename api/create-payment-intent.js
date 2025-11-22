import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      amount,                    // 顧客が手動で入力した決済金額（必須）
      currency = 'jpy', 
      product_id,                // 事前に作成した商品ID（オプション）
      product_name,              // 商品名（product_idがない場合に使用）
      application_fee_amount,     // アプリケーション手数料（オプション）
      transfer_data,             // Stripe Connectへの送金情報（必須: stripeAccountを含む）
      metadata,                  // メタデータ
      stripeAccount              // Stripe ConnectアカウントID（必須: acct_1SR7PwHiuauiyvI5）
    } = req.body;

    // 必須パラメータのチェック
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '決済金額（amount）は必須で、0より大きい値である必要があります' });
    }

    if (!stripeAccount) {
      return res.status(400).json({ error: 'Stripe ConnectアカウントID（stripeAccount）は必須です' });
    }

    if (!transfer_data || !transfer_data.destination) {
      return res.status(400).json({ error: 'transfer_data.destination（Stripe ConnectアカウントID）は必須です' });
    }

    console.log('Stripe Connect決済Intent作成開始:', {
      amount,
      currency,
      product_id,
      product_name,
      application_fee_amount,
      transfer_data,
      metadata,
      stripeAccount
    });

    // 商品情報を準備
    let lineItem = {};
    if (product_id) {
      // 事前に作成した商品IDを使用（価格は動的に設定）
      lineItem = {
        price_data: {
          currency: currency,
          product: product_id,
          unit_amount: amount, // 顧客が手動で入力した金額
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
          unit_amount: amount, // 顧客が手動で入力した金額
        },
        quantity: 1,
      };
    }

    // Checkout Sessionを作成（Stripe Connectアカウントで）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5175'}/payment-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5175'}/payment?canceled=true`,
      payment_intent_data: {
        application_fee_amount: application_fee_amount,
        transfer_data: transfer_data,
        metadata: {
          ...metadata,
          amount: amount.toString(),
          currency: currency,
          created_via: '87app'
        },
      },
    }, {
      stripeAccount: stripeAccount // Stripe Connectアカウントで作成
    });

    console.log('Checkout Session作成成功:', session.id);

    // Payment Intentも作成（必要に応じて）
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      application_fee_amount: application_fee_amount,
      transfer_data: transfer_data,
      metadata: {
        ...metadata,
        amount: amount.toString(),
        currency: currency,
        created_via: '87app',
        checkout_session_id: session.id
      },
      automatic_payment_methods: {
        enabled: true,
      },
    }, {
      stripeAccount: stripeAccount // Stripe Connectアカウントで作成
    });

    console.log('Payment Intent作成成功:', paymentIntent.id);

    res.status(200).json({
      sessionId: session.id,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      success: true
    });

  } catch (error) {
    console.error('Stripe Connect決済Intent作成エラー:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      success: false
    });
  }
}
