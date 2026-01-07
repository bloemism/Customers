import Stripe from 'stripe';

// Stripeインスタンスを取得する関数（エラーハンドリング付き）
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountId } = req.method === 'GET' ? req.query : req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountIdが必要です' });
    }

    console.log('連結アカウント状態確認開始:', { accountId });

    const stripe = getStripe();

    // 連結アカウントの詳細を取得
    const account = await stripe.accounts.retrieve(accountId);

    console.log('連結アカウント情報:', {
      id: account.id,
      type: account.type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      capabilities: account.capabilities,
      requirements: account.requirements ? {
        currently_due: account.requirements.currently_due,
        eventually_due: account.requirements.eventually_due,
        past_due: account.requirements.past_due,
        pending_verification: account.requirements.pending_verification,
        disabled_reason: account.requirements.disabled_reason,
        current_deadline: account.requirements.current_deadline,
      } : null,
    });

    // オンボーディングリンクが必要かどうかを判定
    const needsOnboarding = !account.details_submitted || !account.charges_enabled;
    const hasPendingRequirements = account.requirements && (
      account.requirements.currently_due?.length > 0 ||
      account.requirements.past_due?.length > 0
    );

    // オンボーディングリンクを作成（必要な場合）
    let onboardingUrl = null;
    if (needsOnboarding || hasPendingRequirements) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
        || process.env.VITE_BASE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'https://customers-three-rust.vercel.app';

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/stripe-connect-refresh?account_id=${accountId}`,
        return_url: `${baseUrl}/stripe-connect-return?account_id=${accountId}`,
        type: 'account_onboarding',
      });

      onboardingUrl = accountLink.url;
      console.log('オンボーディングリンク作成:', onboardingUrl);
    }

    return res.status(200).json({
      success: true,
      account: {
        id: account.id,
        type: account.type,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        capabilities: account.capabilities,
        requirements: account.requirements ? {
          currently_due: account.requirements.currently_due,
          eventually_due: account.requirements.eventually_due,
          past_due: account.requirements.past_due,
          pending_verification: account.requirements.pending_verification,
          disabled_reason: account.requirements.disabled_reason,
          current_deadline: account.requirements.current_deadline,
        } : null,
      },
      needsOnboarding,
      hasPendingRequirements,
      onboardingUrl,
    });

  } catch (error) {
    console.error('連結アカウント状態確認エラー:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(500).json({
      success: false,
      error: error.message || '連結アカウントの状態確認に失敗しました',
    });
  }
}

