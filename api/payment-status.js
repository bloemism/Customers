import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONSリクエストの処理（プリフライト）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payment_intent_id } = req.query;

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    console.log('決済状態確認開始:', payment_intent_id);

    // Payment Intentを取得
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    console.log('決済状態:', paymentIntent.status);

    if (paymentIntent.status === 'succeeded') {
      // 決済成功時のデータを返す
      const metadata = paymentIntent.metadata;
      
      const result = {
        success: true,
        data: {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status,
          store_name: metadata.store_name || '不明な店舗',
          customer_id: metadata.customer_id || '',
          points_used: parseInt(metadata.points_used || '0'),
          points_earned: Math.floor(paymentIntent.amount * 0.05), // 5%のポイント付与
          store_id: metadata.store_id || '',
          created_at: new Date(paymentIntent.created * 1000).toISOString()
        }
      };

      console.log('決済成功データ:', result);
      res.status(200).json(result);
    } else {
      // 決済がまだ完了していない場合
      res.status(200).json({
        success: false,
        data: {
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
          message: '決済がまだ完了していません'
        }
      });
    }

  } catch (error) {
    console.error('決済状態確認エラー:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      success: false
    });
  }
}
