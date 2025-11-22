// api/create-product.js
// Stripe Connectアカウントで商品を作成するAPI（価格なし）
// 価格は決済時に顧客が手動で入力するため、商品のみを作成します
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      name,                    // 商品名（必須）
      description,             // 商品説明（オプション）
      images = [],             // 商品画像URLの配列（オプション）
      metadata = {},           // メタデータ（オプション）
      stripeAccount            // Stripe ConnectアカウントID（必須: acct_1SR7PwHiuauiyvI5）
    } = req.body;

    // 必須パラメータのチェック
    if (!name) {
      return res.status(400).json({ error: '商品名（name）は必須です' });
    }

    if (!stripeAccount) {
      return res.status(400).json({ error: 'Stripe ConnectアカウントID（stripeAccount）は必須です' });
    }

    console.log('Stripe Connect商品作成開始（価格なし）:', {
      name,
      description,
      stripeAccount
    });

    // 商品（Product）を作成（価格は含めない）
    // 価格は決済時に顧客が手動で入力するため、price_dataで動的に設定します
    const product = await stripe.products.create({
      name: name,
      description: description,
      images: images.length > 0 ? images : undefined,
      metadata: {
        ...metadata,
        created_via: '87app',
        created_at: new Date().toISOString(),
        price_type: 'manual' // 手動入力であることを示すフラグ
      }
    }, {
      stripeAccount: stripeAccount // Stripe Connectアカウントで作成
    });

    console.log('商品作成成功:', product.id);

    res.status(200).json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata
      },
      message: '商品を作成しました。価格は決済時に顧客が手動で入力します。'
    });

  } catch (error) {
    console.error('Stripe Connect商品作成エラー:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      success: false
    });
  }
}

