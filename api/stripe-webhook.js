import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabaseクライアントの作成
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aoqmdyapjsmmvjrwfdup.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIseyJpYXQiOjE3NTQ5OTY2NTAsImV4cCI6MjA3MDU3MjY1MH0.v8vniAL-aYfmFZgVDfBa6q_RoTrvmE_uXQjQweLiui8';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Webhook受信:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      
      default:
        console.log(`未処理のイベントタイプ: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook処理エラー:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// 決済成功時の処理
async function handlePaymentSucceeded(paymentIntent) {
  console.log('決済成功処理開始:', paymentIntent.id);

  const metadata = paymentIntent.metadata;
  const customerId = metadata.customer_id;
  const pointsUsed = parseInt(metadata.points_used || '0');
  const pointsEarned = Math.floor(paymentIntent.amount * 0.05); // 5%のポイント付与

  try {
    // 顧客データを更新
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        points: supabase.sql`points - ${pointsUsed} + ${pointsEarned}`,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customerId);

    if (updateError) {
      console.error('顧客データ更新エラー:', updateError);
    } else {
      console.log('顧客データ更新成功');
    }

    // 決済履歴を記録
    const { error: historyError } = await supabase
      .from('customer_payments')
      .insert([
        {
          user_id: customerId,
          store_id: metadata.store_id || '',
          amount: paymentIntent.amount,
          points_used: pointsUsed,
          payment_method: 'stripe_connect',
          status: 'completed',
          stripe_payment_intent_id: paymentIntent.id,
          created_at: new Date().toISOString()
        }
      ]);

    if (historyError) {
      console.error('決済履歴記録エラー:', historyError);
    } else {
      console.log('決済履歴記録成功');
    }

    // ポイント履歴を記録
    if (pointsEarned > 0) {
      const { error: pointError } = await supabase
        .from('point_history')
        .insert([
          {
            user_id: customerId,
            points: pointsEarned,
            reason: `決済完了 - ${metadata.store_name || '不明な店舗'}`,
            type: 'earned',
            created_at: new Date().toISOString()
          }
        ]);

      if (pointError) {
        console.error('ポイント履歴記録エラー:', pointError);
      } else {
        console.log('ポイント履歴記録成功');
      }
    }

    // ポイント使用履歴を記録
    if (pointsUsed > 0) {
      const { error: pointUsedError } = await supabase
        .from('point_history')
        .insert([
          {
            user_id: customerId,
            points: -pointsUsed,
            reason: `決済時のポイント使用 - ${metadata.store_name || '不明な店舗'}`,
            type: 'used',
            created_at: new Date().toISOString()
          }
        ]);

      if (pointUsedError) {
        console.error('ポイント使用履歴記録エラー:', pointUsedError);
      } else {
        console.log('ポイント使用履歴記録成功');
      }
    }

  } catch (error) {
    console.error('決済成功処理エラー:', error);
  }
}

// 決済失敗時の処理
async function handlePaymentFailed(paymentIntent) {
  console.log('決済失敗処理開始:', paymentIntent.id);

  const metadata = paymentIntent.metadata;
  const customerId = metadata.customer_id;

  try {
    // 決済履歴を記録（失敗）
    const { error: historyError } = await supabase
      .from('customer_payments')
      .insert([
        {
          user_id: customerId,
          store_id: metadata.store_id || '',
          amount: paymentIntent.amount,
          points_used: 0,
          payment_method: 'stripe_connect',
          status: 'failed',
          stripe_payment_intent_id: paymentIntent.id,
          created_at: new Date().toISOString()
        }
      ]);

    if (historyError) {
      console.error('決済失敗履歴記録エラー:', historyError);
    } else {
      console.log('決済失敗履歴記録成功');
    }

  } catch (error) {
    console.error('決済失敗処理エラー:', error);
  }
}

// 送金作成時の処理
async function handleTransferCreated(transfer) {
  console.log('送金作成処理開始:', transfer.id);

  try {
    // 送金履歴を記録（必要に応じて）
    console.log('送金作成成功:', {
      id: transfer.id,
      amount: transfer.amount,
      destination: transfer.destination,
      status: transfer.status
    });

  } catch (error) {
    console.error('送金作成処理エラー:', error);
  }
}
