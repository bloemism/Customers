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

    // 決済Intentを作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      application_fee_amount: application_fee_amount,
      transfer_data: transfer_data,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('決済Intent作成成功:', paymentIntent.id);

    // Checkout Sessionを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: metadata?.store_name || '花屋でのお買い物',
              description: '87app経由での決済',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5175'}/payment-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5175'}/payment?canceled=true`,
      payment_intent_data: {
        application_fee_amount: application_fee_amount,
        transfer_data: transfer_data,
        metadata: metadata,
      },
    });

    console.log('Checkout Session作成成功:', session.id);

    res.status(200).json({
      sessionId: session.id,
      payment_intent_id: paymentIntent.id,
      success: true
    });

  } catch (error) {
    console.error('決済Intent作成エラー:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      success: false
    });
  }
}
