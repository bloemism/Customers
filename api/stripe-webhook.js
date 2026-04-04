import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY が設定されていません');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Supabaseクライアントの作成
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aoqmdyapjsmmvjrwfdup.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIseyJpYXQiOjE3NTQ5OTY2NTAsImV4cCI6MjA3MDU3MjY1MH0.v8vniAL-aYfmFZgVDfBa6q_RoTrvmE_uXQjQweLiui8';

const supabase = createClient(supabaseUrl, supabaseKey);

function buildPaymentDataFromMetadata(metadata, amountYen) {
  let rawItems = [];
  try {
    if (metadata.items) {
      rawItems =
        typeof metadata.items === 'string' ? JSON.parse(metadata.items) : metadata.items;
    }
  } catch {
    rawItems = [];
  }
  if (!Array.isArray(rawItems)) rawItems = [];
  const items = rawItems.map((it) => {
    const qty = it.quantity ?? 1;
    const unit = it.unit_price ?? it.price ?? 0;
    const total = it.total ?? unit * qty;
    return {
      id: it.id,
      name: it.name || it.item_name || '商品',
      price: unit,
      quantity: qty,
      total
    };
  });
  const subtotalFromLines = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
  const subtotal = subtotalFromLines > 0 ? subtotalFromLines : amountYen;
  const tax = Math.round(subtotal * 0.1);
  const sn = metadata.store_name || null;
  return {
    items,
    subtotal,
    tax,
    store_name: sn,
    storeName: sn,
    paymentCode: metadata.payment_code || null,
    totalAmount: amountYen
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, endpointSecret);
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
      
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      
      case 'transfer.updated':
        await handleTransferUpdated(event.data.object);
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
  console.log('Payment Intent metadata:', paymentIntent.metadata);

  const metadata = paymentIntent.metadata;
  const customerId = metadata.customer_id;
  const storeId = metadata.store_id;
  const paymentCode = metadata.payment_code;
  const pointsUsed = parseInt(metadata.points_used || '0');
  const pointsEarned = Math.floor(paymentIntent.amount / 100 * 0.05); // 5%のポイント付与（amountはセント単位）

  if (!customerId) {
    console.error('customer_idがmetadataに含まれていません');
    return;
  }

  if (!storeId) {
    console.error('store_idがmetadataに含まれていません');
    return;
  }

  try {
    // 1. 顧客の user_id（customer_payments / レジャートリガー用）
    let userIdForPayment = null;
    const { data: crow } = await supabase
      .from('customers')
      .select('user_id')
      .eq('id', customerId)
      .maybeSingle();
    if (crow?.user_id) {
      userIdForPayment = crow.user_id;
    }

    // 2. 決済履歴（正）— INSERT だけ。point_history / customers は DB トリガー apply_customer_payment_ledger
    const amountYen = paymentIntent.amount / 100;
    const payment_data = buildPaymentDataFromMetadata(metadata, amountYen);
    const { error: historyError } = await supabase
      .from('customer_payments')
      .insert([
        {
          customer_id: customerId,
          user_id: userIdForPayment,
          store_id: storeId,
          amount: amountYen,
          points_earned: pointsEarned,
          points_used: pointsUsed,
          payment_method: 'stripe_checkout',
          status: 'completed',
          payment_code: paymentCode,
          stripe_payment_intent_id: paymentIntent.id,
          payment_data,
          created_at: new Date().toISOString()
        }
      ]);

    if (historyError) {
      console.error('決済履歴記録エラー:', historyError);
    } else {
      console.log('決済履歴記録成功（レジャーはトリガーで反映）');
    }

    // 3. 店舗への送金処理（Destination Charges方式）
    // 決済成功後、自動的に店舗の銀行口座に送金
    if (storeId) {
      try {
        const { transferToStore } = await import('./transfer-to-store.js');
        const transferResult = await transferToStore(paymentIntent.id, storeId);
        
        if (transferResult.success) {
          console.log('店舗への送金処理成功:', transferResult.transferInfo);
          
          // 送金履歴のステータスを更新
          if (transferResult.transaction) {
            await supabase
              .from('payment_transactions')
              .update({
                status: 'succeeded',
                updated_at: new Date().toISOString()
              })
              .eq('id', transferResult.transaction.id);
          }
        } else {
          console.error('店舗への送金処理失敗:', transferResult.error);
          // 送金失敗時も決済は成功として記録（後で手動送金可能）
        }
      } catch (transferError) {
        console.error('送金処理エラー:', transferError);
        // 送金エラーは記録するが、決済成功処理は続行
      }
    }

  } catch (error) {
    console.error('決済成功処理エラー:', error);
  }
}

// 決済失敗時の処理
async function handlePaymentFailed(paymentIntent) {
  console.log('決済失敗処理開始:', paymentIntent.id);
  console.log('Payment Intent metadata:', paymentIntent.metadata);

  const metadata = paymentIntent.metadata;
  const customerId = metadata.customer_id;
  const storeId = metadata.store_id;
  const paymentCode = metadata.payment_code;

  if (!customerId) {
    console.error('customer_idがmetadataに含まれていません');
    return;
  }

  try {
    // 決済履歴を記録（失敗）
    const { error: historyError } = await supabase
      .from('customer_payments')
      .insert([
        {
          customer_id: customerId,
          store_id: storeId,
          amount: paymentIntent.amount / 100, // 円に変換
          points_earned: 0,
          points_used: 0,
          payment_method: 'stripe_checkout',
          status: 'failed',
          payment_code: paymentCode,
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

// アカウント更新時の処理
async function handleAccountUpdated(account) {
  console.log('アカウント更新処理開始:', account.id);

  try {
    // Supabaseで該当する店舗を検索
    const { data: stores, error: searchError } = await supabase
      .from('stores')
      .select('id')
      .eq('stripe_account_id', account.id);

    if (searchError) {
      console.error('店舗検索エラー:', searchError);
      return;
    }

    if (!stores || stores.length === 0) {
      console.log('該当する店舗が見つかりません:', account.id);
      return;
    }

    const storeId = stores[0].id;

    // 店舗情報を更新
    const { error: updateError } = await supabase
      .from('stores')
      .update({
        stripe_account_status: account.details_submitted ? 'active' : 'pending',
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
        stripe_onboarding_completed: account.details_submitted && account.charges_enabled,
        stripe_updated_at: new Date().toISOString()
      })
      .eq('id', storeId);

    if (updateError) {
      console.error('店舗情報更新エラー:', updateError);
    } else {
      console.log('店舗情報更新成功:', storeId);
    }

  } catch (error) {
    console.error('アカウント更新処理エラー:', error);
  }
}

// 送金作成時の処理
async function handleTransferCreated(transfer) {
  console.log('送金作成処理開始:', transfer.id);

  try {
    // payment_transactionsテーブルを更新
    if (transfer.source_transaction) {
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          stripe_transfer_id: transfer.id,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', transfer.source_transaction);

      if (updateError) {
        console.error('トランザクション更新エラー:', updateError);
      } else {
        console.log('トランザクション更新成功');
      }
    }

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

// 送金更新時の処理
async function handleTransferUpdated(transfer) {
  console.log('送金更新処理開始:', transfer.id);

  try {
    // 送金ステータスを記録
    console.log('送金更新成功:', {
      id: transfer.id,
      amount: transfer.amount,
      destination: transfer.destination,
      status: transfer.status
    });

  } catch (error) {
    console.error('送金更新処理エラー:', error);
  }
}
