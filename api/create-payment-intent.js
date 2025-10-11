import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      amount, 
      currency = 'jpy', 
      application_fee_amount,
      transfer_data,
      metadata 
    } = req.body;

    console.log('決済Intent作成開始:', {
      amount,
      currency,
      application_fee_amount,
      transfer_data,
      metadata
    });

    // Checkout Sessionを作成（シンプル版：Stripe Connect無し）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: metadata?.storeName || metadata?.store_name || '花屋でのお買い物',
              description: '87app経由での決済',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://customers-three-rust.vercel.app'}/payment-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://customers-three-rust.vercel.app'}/store-payment?canceled=true`,
      metadata: metadata,
    });

    console.log('Checkout Session作成成功:', session.id);

    res.status(200).json({
      sessionId: session.id,
      clientSecret: session.client_secret,
      url: session.url,
      success: true
    });

  } catch (error) {
    console.error('決済Intent作成エラー:', error);
    console.error('エラー詳細:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      type: error.type,
      code: error.code,
      details: error.raw || {},
      success: false
    });
  }
}
