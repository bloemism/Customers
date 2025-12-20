import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabaseクライアントの作成
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aoqmdyapjsmmvjrwfdup.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW1keWFwanNtbXZqcndmZHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5NjY1MCwiZXhwIjoyMDcwNTcyNjUwfQ.v8vniAL-aYfmFZgVDfBa6q_RoTrvmE_uXQjQweLiui8';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { storeId, accountId } = req.body;

    if (!storeId || !accountId) {
      return res.status(400).json({ error: 'storeIdとaccountIdが必要です' });
    }

    console.log('オンボーディングリンク再生成開始:', { storeId, accountId });

    // 1. Stripe Account Linkを作成
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5174'}/stripe-connect-refresh?store_id=${storeId}`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5174'}/stripe-connect-return?store_id=${storeId}`,
      type: 'account_onboarding',
    });

    console.log('オンボーディングリンク作成成功:', accountLink.url);

    res.status(200).json({
      success: true,
      url: accountLink.url,
    });

  } catch (error) {
    console.error('オンボーディングリンク作成エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'オンボーディングリンクの作成に失敗しました',
    });
  }
}






