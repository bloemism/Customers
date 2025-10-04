// Stripe Payment Intent作成用API
// Supabase Edge Functionとして実装

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// 環境変数
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Supabaseクライアント（サービスロール）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Stripeクライアント
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'jpy', metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Payment Intent作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // セント単位
      currency: currency,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
        platform: 'bloemism-87app'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // 決済履歴をデータベースに記録
    if (metadata.customerId && metadata.storeId) {
      await supabase
        .from('payment_transactions')
        .insert({
          stripe_payment_intent_id: paymentIntent.id,
          amount: Math.round(amount),
          platform_fee: Math.round(amount * 0.03), // 3%手数料
          stripe_fee: Math.round(amount * 0.036) + 40, // Stripe手数料
          store_amount: Math.round(amount * 0.964) - 40, // 店舗受取額
          currency: currency,
          status: 'pending',
          metadata: metadata
        });
    }

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency
    });

  } catch (error) {
    console.error('Payment Intent作成エラー:', error);
    res.status(500).json({ 
      error: 'Payment Intent作成に失敗しました',
      details: error.message 
    });
  }
}

