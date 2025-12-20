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
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
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

// Checkout Session完了時の処理
async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout Session完了処理開始:', session.id);
  console.log('Session metadata:', session.metadata);

  const metadata = session.metadata;
  const customerId = metadata.customer_id;
  const storeId = metadata.store_id;
  const paymentCode = metadata.payment_code;

  if (!paymentCode) {
    console.error('payment_codeがmetadataに含まれていません');
    return;
  }

  try {
    // Payment Intentを取得
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

    // payment_codesからpayment_dataを取得
    let paymentData = null;
    if (paymentCode.length === 5) {
      const { data: codeData } = await supabase
        .from('payment_codes')
        .select('payment_data')
        .eq('code', paymentCode)
        .single();
      
      if (codeData?.payment_data) {
        paymentData = codeData.payment_data;
      }
    }

    // payment_transactionsテーブルを更新
    const { error: transactionUpdateError } = await supabase
      .from('payment_transactions')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('payment_code', paymentCode)
      .eq('status', 'pending');

    if (transactionUpdateError) {
      console.error('payment_transactions更新エラー:', transactionUpdateError);
    } else {
      console.log('payment_transactions更新成功');
    }

    // 決済コードを使用済みにマーク
    if (paymentCode.length === 5) {
      await supabase
        .from('payment_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('code', paymentCode)
        .is('used_at', null);
    } else if (paymentCode.length === 6) {
      await supabase
        .from('remote_invoice_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('code', paymentCode)
        .is('used_at', null);
    }

    // 顧客IDがある場合は、payment_intent.succeededの処理も実行（payment_dataを渡す）
    if (customerId && paymentIntent) {
      await handlePaymentSucceeded(paymentIntent, paymentData);
    }

  } catch (error) {
    console.error('Checkout Session完了処理エラー:', error);
  }
}

// 決済成功時の処理
async function handlePaymentSucceeded(paymentIntent, paymentDataFromCode = null) {
  console.log('決済成功処理開始:', paymentIntent.id);
  console.log('Payment Intent metadata:', paymentIntent.metadata);

  const metadata = paymentIntent.metadata;
  const customerId = metadata.customer_id;
  const storeId = metadata.store_id;
  const paymentCode = metadata.payment_code;
  const pointsUsed = parseInt(metadata.points_used || '0');
  
  // ポイント差し引き後の金額（実際の決済金額）から5%を計算
  // final_amountが設定されていればそれを使用、なければpaymentIntent.amountを使用
  const finalAmount = parseInt(metadata.final_amount || (paymentIntent.amount / 100).toString());
  const pointsEarned = Math.floor(finalAmount * 0.05); // 5%のポイント付与

  // payment_dataを取得（引数で渡されていない場合は、payment_codesから取得）
  let paymentData = paymentDataFromCode;
  if (!paymentData && paymentCode && paymentCode.length === 5) {
    const { data: codeData } = await supabase
      .from('payment_codes')
      .select('payment_data')
      .eq('code', paymentCode)
      .single();
    
    if (codeData?.payment_data) {
      paymentData = codeData.payment_data;
    }
  }

  console.log('ポイント計算:', {
    pointsUsed,
    finalAmount,
    pointsEarned,
    paymentIntentAmount: paymentIntent.amount / 100,
    hasPaymentData: !!paymentData
  });

  if (!customerId) {
    console.error('customer_idがmetadataに含まれていません');
    return;
  }

  try {
    // 1. 顧客の現在のポイントを取得
    const { data: customerData, error: fetchError } = await supabase
      .from('customers')
      .select('total_points')
      .eq('id', customerId)
      .single();

    if (fetchError) {
      console.error('顧客データ取得エラー:', fetchError);
    } else {
      console.log('顧客の現在のポイント:', customerData?.total_points || 0);
    }

    // 2. ポイント使用を処理
    // 決済コード生成時に既にpayment_dataに合計、使用ポイント、差し引き後の金額、消費税が含まれているため、
    // 決済コード生成時にポイントが既に引かれている可能性がある
    // payment_dataのtotalAmountが既にポイント差し引き後の金額であるため、ポイントを再度引く必要はない
    let shouldDeductPoints = false; // デフォルトは引かない
    
    // 決済コード生成時にポイントが引かれていない場合のみ、Webhookでポイントを引く
    // payment_codesテーブルから決済コードの情報を取得
    if (paymentCode && paymentCode.length === 5) {
      const { data: codeData } = await supabase
        .from('payment_codes')
        .select('payment_data, created_at')
        .eq('code', paymentCode)
        .single();
      
      if (codeData?.payment_data) {
        // payment_dataにpointsUsedが含まれていて、totalAmountが既にポイント差し引き後の金額である場合
        // 決済コード生成時にポイントが引かれている可能性がある
        // ポイント使用履歴を確認して、既に処理済みかどうかを確認
        if (codeData.payment_data.pointsUsed && codeData.payment_data.pointsUsed > 0) {
          // 決済コード生成時（created_at）から10分以内にポイント使用履歴があるか確認
          const codeCreatedAt = new Date(codeData.created_at);
          const { data: pointHistory } = await supabase
            .from('point_history')
            .select('*')
            .eq('user_id', customerId)
            .eq('points_change', -Math.abs(pointsUsed)) // 絶対値で比較
            .eq('transaction_type', 'spent')
            .gte('created_at', codeCreatedAt.toISOString()) // 決済コード生成時以降
            .order('created_at', { ascending: false })
            .limit(1);
          
          // 決済コード生成時以降にポイント使用履歴がない場合、Webhookでポイントを引く必要がある
          if (!pointHistory || pointHistory.length === 0) {
            shouldDeductPoints = true;
            console.log('決済コード生成時にポイントが引かれていないため、Webhookでポイントを引きます。', {
              paymentCode,
              pointsUsed,
              codeCreatedAt: codeData.created_at
            });
          } else {
            console.log('決済コード生成時に既にポイントが引かれています。再度引きません。', {
              paymentCode,
              pointsUsed,
              historyDate: pointHistory[0].created_at
            });
          }
        }
      }
    }

    // 3. 顧客データを更新（ポイント付与と使用）
    // ポイント使用は既に処理済みの可能性があるため、shouldDeductPointsで制御
    const currentPoints = customerData?.total_points || 0;
    const newPoints = currentPoints + pointsEarned - (shouldDeductPoints ? pointsUsed : 0);
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        total_points: newPoints,
        total_purchase_amount: supabase.sql`total_purchase_amount + ${finalAmount}`, // ポイント差し引き後の金額を使用
        last_purchase_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('顧客データ更新エラー:', updateError);
    } else {
      console.log('顧客データ更新成功:', { customerId, newPoints });
    }

    // 4. 決済履歴を記録（customer_payments）- 顧客アプリ用
    // amountはポイント差し引き後の金額（finalAmount）を使用
    // payment_dataの情報も含める
    const { error: historyError } = await supabase
      .from('customer_payments')
      .insert([
        {
          user_id: customerId, // customer_idではなくuser_id
          store_id: storeId,
          amount: finalAmount, // ポイント差し引き後の金額
          points_earned: pointsEarned,
          points_spent: pointsUsed, // points_usedではなくpoints_spent
          payment_method: 'stripe_checkout',
          status: 'completed',
          payment_date: new Date().toISOString(),
          payment_code: paymentCode,
          // payment_dataの情報をJSONBとして保存（品目、色、本数など）
          payment_data: paymentData ? {
            items: paymentData.items || [],
            subtotal: paymentData.subtotal || 0,
            tax: paymentData.tax || 0,
            totalAmount: paymentData.totalAmount || finalAmount,
            storeName: paymentData.storeName || metadata.store_name,
            paymentCode: paymentCode
          } : null,
          created_at: new Date().toISOString()
        }
      ]);

    if (historyError) {
      console.error('決済履歴記録エラー:', historyError);
    } else {
      console.log('決済履歴記録成功');
    }

    // 5. 店舗アプリ用の購入履歴を記録（purchases + purchase_items）
    if (paymentData && paymentData.items && paymentData.items.length > 0) {
      // purchasesテーブルに記録
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert([
          {
            customer_id: customerId,
            store_id: storeId,
            purchase_date: new Date().toISOString(),
            total_amount: paymentData.subtotal || 0,
            tax_amount: paymentData.tax || 0,
            points_earned: pointsEarned,
            points_used: pointsUsed,
            payment_method: 'stripe_checkout',
            qr_code_data: {
              payment_code: paymentCode,
              payment_data: paymentData,
              stripe_payment_intent_id: paymentIntent.id
            },
            notes: `決済コード: ${paymentCode}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (purchaseError) {
        console.error('purchases記録エラー:', purchaseError);
      } else if (purchaseData) {
        console.log('purchases記録成功:', purchaseData.id);
        
        // purchase_itemsテーブルに品目を記録
        const purchaseItems = paymentData.items.map((item: any) => {
          // nameから品目名と色名を抽出（例: "カーネーション (白)"）
          const nameMatch = item.name?.match(/^(.+?)\s*\((.+?)\)$/);
          const itemName = nameMatch ? nameMatch[1] : item.name || '不明';
          const colorName = nameMatch ? nameMatch[2] : '-';
          
          return {
            purchase_id: purchaseData.id,
            item_name: `${itemName} (${colorName})`, // 品目名と色名を含める
            unit_price: item.price || 0,
            quantity: item.quantity || 1,
            total_price: item.total || (item.price * item.quantity) || 0,
            created_at: new Date().toISOString()
          };
        });

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(purchaseItems);

        if (itemsError) {
          console.error('purchase_items記録エラー:', itemsError);
        } else {
          console.log('purchase_items記録成功:', purchaseItems.length, '件');
        }
      }
    }

    // 6. ポイント履歴を記録（付与）- 顧客アプリ用
    if (pointsEarned > 0) {
      const { error: pointError } = await supabase
        .from('point_history')
        .insert([
          {
            user_id: customerId,
            store_id: storeId,
            points_change: pointsEarned,
            transaction_type: 'earned',
            description: `決済完了 - ${metadata.store_name || '不明な店舗'} (決済コード: ${paymentCode})${paymentData?.items ? ` - ${paymentData.items.length}品目` : ''}`,
            created_at: new Date().toISOString()
          }
        ]);

      if (pointError) {
        console.error('ポイント履歴記録エラー（付与）:', pointError);
      } else {
        console.log('ポイント履歴記録成功（付与）:', pointsEarned);
      }
    }

    // 7. ポイント使用履歴を記録（既に処理済みでない場合のみ）- 顧客アプリ用
    if (pointsUsed > 0 && shouldDeductPoints) {
      const { error: pointUsedError } = await supabase
        .from('point_history')
        .insert([
          {
            user_id: customerId,
            store_id: storeId,
            points_change: -pointsUsed,
            transaction_type: 'spent',
            description: `決済時のポイント使用 - ${metadata.store_name || '不明な店舗'} (決済コード: ${paymentCode})${paymentData?.items ? ` - ${paymentData.items.length}品目` : ''}`,
            created_at: new Date().toISOString()
          }
        ]);

      if (pointUsedError) {
        console.error('ポイント使用履歴記録エラー:', pointUsedError);
      } else {
        console.log('ポイント使用履歴記録成功:', pointsUsed);
      }
    } else if (pointsUsed > 0 && !shouldDeductPoints) {
      console.log('ポイント使用は既に処理済みのため、履歴を記録しません:', pointsUsed);
    }

    // 6. payment_transactionsテーブルを更新（Stripe Connect決済の場合）
    if (paymentCode && storeId) {
      const platformFee = parseInt(metadata.platform_fee || '0');
      const stripeFee = parseInt(metadata.stripe_fee || '0');
      const storeAmount = parseInt(metadata.store_amount || '0');

      const { error: transactionUpdateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (transactionUpdateError) {
        console.error('payment_transactions更新エラー:', transactionUpdateError);
      } else {
        console.log('payment_transactions更新成功');
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
