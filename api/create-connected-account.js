import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabaseクライアントの作成
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aoqmdyapjsmmvjrwfdup.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NjY1MCwiZXhwIjoyMDcwNTcyNjUwfQ.v8vniAL-aYfmFZgVDfBa6q_RoTrvmE_uXQjQweLiui8';

const supabase = createClient(supabaseUrl, supabaseKey);

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      storeId,
      email,
      businessName,
      businessType = 'individual',
      country = 'JP',
      currency = 'jpy'
    } = req.body;

    console.log('Connected Account作成開始:', {
      storeId,
      email,
      businessName,
      businessType,
      country
    });

    // 1. Stripe Connected Accountを作成
    const account = await stripe.accounts.create({
      type: 'express', // Express アカウント（簡単なオンボーディング）
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: businessType,
      business_profile: {
        name: businessName,
        product_description: '花屋・フラワースクール',
        support_email: email,
      },
      metadata: {
        store_id: storeId,
        platform: 'bloemism-87app',
      },
    });

    console.log('Stripe Connected Account作成成功:', account.id);

    // 2. Supabaseのstoresテーブルを更新
    const { data: updateData, error: updateError } = await supabase
      .from('stores')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'created',
        stripe_account_type: 'express',
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
        stripe_updated_at: new Date().toISOString(),
      })
      .eq('id', storeId)
      .select();

    if (updateError) {
      console.error('Supabase更新エラー:', updateError);
      throw new Error(`データベース更新エラー: ${updateError.message}`);
    }

    console.log('Supabase更新成功:', updateData);

    // ベースURLを取得（環境変数またはデフォルト値）
    // 本番環境ではVercelのURLを自動検出
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || (req.headers.host ? `https://${req.headers.host}` : null)
      || 'http://localhost:5173';

    // 3. オンボーディングリンクを作成
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/stripe-connect-refresh?store_id=${storeId}`,
      return_url: `${baseUrl}/stripe-connect-return?store_id=${storeId}`,
      type: 'account_onboarding',
    });

    console.log('オンボーディングリンク作成成功:', accountLink.url);

    res.status(200).json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      },
    });

  } catch (error) {
    console.error('Connected Account作成エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Connected Accountの作成に失敗しました',
    });
  }
}






