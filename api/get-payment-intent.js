import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payment_intent_id } = req.query;

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'payment_intent_idが必要です' });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    res.status(200).json({
      success: true,
      paymentIntent: paymentIntent
    });
  } catch (error) {
    console.error('Payment Intent取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

