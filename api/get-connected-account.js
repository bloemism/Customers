import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabaseクライアントの作成
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aoqmdyapjsmmvjrwfdup.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NjY1MCwiZXhwIjoyMDcwNTcyNjUwfQ.v8vniAL-aYfmFZgVDfBa6q_RoTrvmE_uXQjQweLiui8';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: 'storeIdが必要です' });
    }

    console.log('Connected Account情報取得開始:', storeId);

    // 1. Supabaseから店舗情報を取得
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, name, stripe_account_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
      .eq('id', storeId)
      .single();

    if (storeError) {
      console.error('店舗情報取得エラー:', storeError);
      throw new Error(`店舗情報の取得に失敗しました: ${storeError.message}`);
    }

    if (!storeData) {
      return res.status(404).json({ error: '店舗が見つかりません' });
    }

    // 2. Stripe Account IDがない場合
    if (!storeData.stripe_account_id) {
      return res.status(200).json({
        success: true,
        hasAccount: false,
        store: {
          id: storeData.id,
          name: storeData.name,
        },
        message: 'Stripe Connected Accountが作成されていません',
      });
    }

    // 3. Stripeからアカウント情報を取得
    const account = await stripe.accounts.retrieve(storeData.stripe_account_id);

    console.log('Stripe Account情報取得成功:', account.id);

    // 4. Supabaseの情報を最新に更新
    const { error: updateError } = await supabase
      .from('stores')
      .update({
        stripe_account_status: account.details_submitted ? 'active' : 'pending',
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
        stripe_onboarding_completed: account.details_submitted && account.charges_enabled,
        stripe_updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (updateError) {
      console.error('Supabase更新エラー:', updateError);
    }

    // 5. レスポンスを返す
    res.status(200).json({
      success: true,
      hasAccount: true,
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        email: account.email,
        business_profile: account.business_profile,
        requirements: account.requirements,
      },
      store: {
        id: storeData.id,
        name: storeData.name,
        stripe_account_status: account.details_submitted ? 'active' : 'pending',
      },
    });

  } catch (error) {
    console.error('Connected Account情報取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'アカウント情報の取得に失敗しました',
    });
  }
}






