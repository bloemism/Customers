import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabaseクライアントの作成
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aoqmdyapjsmmvjrwfdup.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NjY1MCwiZXhwIjoyMDcwNTcyNjUwfQ.v8vniAL-aYfmFZgVDfBa6q_RoTrvmE_uXQjQweLiui8';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 店舗の銀行口座への送金処理
 * 
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @param {string} storeId - 店舗ID
 * @returns {Promise<{success: boolean, transfer?: any, error?: string}>}
 */
export async function transferToStore(paymentIntentId, storeId) {
  try {
    console.log('店舗への送金処理開始:', { paymentIntentId, storeId });

    // 1. Payment Intentから決済情報を取得
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`決済が完了していません: ${paymentIntent.status}`);
    }

    const totalAmount = paymentIntent.amount; // セント単位

    // 2. 店舗の銀行口座情報を取得
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('bank_name, branch_name, account_number, account_holder, account_type')
      .eq('id', storeId)
      .single();

    if (storeError || !storeData) {
      throw new Error(`店舗情報の取得に失敗しました: ${storeError?.message || '店舗が見つかりません'}`);
    }

    // 銀行口座情報の確認
    if (!storeData.bank_name || !storeData.branch_name || !storeData.account_number || !storeData.account_holder) {
      throw new Error('店舗の銀行口座情報が不完全です');
    }

    // 3. 手数料を計算
    // プラットフォーム手数料: 3%
    const platformFeeRate = 0.03;
    const platformFee = Math.floor(totalAmount * platformFeeRate);
    
    // Stripe手数料: 約3.6% + 固定費（実際の手数料はStripeが自動計算）
    // ここでは概算として計算（実際の手数料はStripeが決済時に差し引く）
    const estimatedStripeFee = Math.floor(totalAmount * 0.036) + 40; // 40円固定費
    
    // 店舗への送金額 = 総額 - プラットフォーム手数料
    // 注意: Stripe手数料は既に決済時に差し引かれているため、ここでは考慮しない
    const storeAmount = totalAmount - platformFee;

    console.log('手数料計算:', {
      totalAmount,
      platformFee,
      estimatedStripeFee,
      storeAmount
    });

    // 4. Stripe Payouts APIで店舗の銀行口座に送金
    // 注意: Stripe Payoutsは日本では直接銀行口座への送金をサポートしていないため、
    // 実際には外部の送金サービス（例: 銀行API）を使用する必要があります
    // ここでは、送金履歴をデータベースに記録し、手動または別のサービスで送金する前提とします

    // 5. 送金履歴をデータベースに保存
    const { data: transactionData, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        store_id: storeId,
        stripe_payment_intent_id: paymentIntentId,
        amount: totalAmount,
        currency: 'jpy',
        platform_fee: platformFee,
        stripe_fee: estimatedStripeFee,
        store_amount: storeAmount,
        status: 'pending', // 送金待ち
        payment_method: 'card',
        metadata: {
          bank_name: storeData.bank_name,
          branch_name: storeData.branch_name,
          account_number: storeData.account_number,
          account_holder: storeData.account_holder,
          account_type: storeData.account_type || '普通'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('送金履歴保存エラー:', transactionError);
      throw new Error(`送金履歴の保存に失敗しました: ${transactionError.message}`);
    }

    console.log('送金履歴保存成功:', transactionData.id);

    // 6. 実際の送金処理（外部サービスを使用）
    // 注意: 実際の実装では、銀行APIや送金サービスを使用して送金を実行します
    // ここでは、送金履歴を記録したことを返します
    
    return {
      success: true,
      transaction: transactionData,
      transferInfo: {
        storeAmount: storeAmount / 100, // 円に変換
        platformFee: platformFee / 100,
        bankAccount: {
          bank_name: storeData.bank_name,
          branch_name: storeData.branch_name,
          account_number: storeData.account_number,
          account_holder: storeData.account_holder
        }
      }
    };

  } catch (error) {
    console.error('店舗への送金処理エラー:', error);
    return {
      success: false,
      error: error.message || '送金処理に失敗しました'
    };
  }
}

// APIエンドポイントとして使用する場合
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
    // エラーレスポンスにもCORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, storeId } = req.body;

    if (!paymentIntentId || !storeId) {
      return res.status(400).json({ error: 'paymentIntentIdとstoreIdが必要です' });
    }

    const result = await transferToStore(paymentIntentId, storeId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('送金APIエラー:', error);
    // エラーレスポンスにもCORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(500).json({ 
      success: false,
      error: error.message || '送金処理に失敗しました'
    });
  }
}

