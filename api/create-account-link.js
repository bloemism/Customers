import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Stripeインスタンスを取得する関数（エラーハンドリング付き）
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

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
    const { storeId, accountId } = req.body;

    if (!storeId || !accountId) {
      return res.status(400).json({ error: 'storeIdとaccountIdが必要です' });
    }

    console.log('オンボーディングリンク再生成開始:', { storeId, accountId });

    const stripe = getStripe();

    // ベースURLを取得（環境変数またはデフォルト値）
    // 本番環境のStripeキーを使用している場合、HTTPSが必要
    // ローカル環境でも本番環境のURLを使用する（Stripe Connectの要件）
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || process.env.VITE_BASE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'https://customers-three-rust.vercel.app';

    // 1. Stripe Account Linkを作成
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/stripe-connect-refresh?store_id=${storeId}`,
      return_url: `${baseUrl}/stripe-connect-return?store_id=${storeId}`,
      type: 'account_onboarding',
    });

    console.log('オンボーディングリンク作成成功:', accountLink.url);

    res.status(200).json({
      success: true,
      url: accountLink.url,
    });

  } catch (error) {
    console.error('オンボーディングリンク作成エラー:', error);
    // エラーレスポンスにもCORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(500).json({
      success: false,
      error: error.message || 'オンボーディングリンクの作成に失敗しました',
    });
  }
}






