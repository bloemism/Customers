/**
 * ローカル開発用のExpressサーバー
 * Vercelのサーバーレス関数をローカルで実行するためのサーバー
 * 
 * 使用方法:
 * npm run dev:local
 * 
 * これにより、localhost:3000でAPIエンドポイントが利用可能になります
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// 環境変数: .env のあと .env.local で上書き（GEMINI_API_KEY はここにだけ書く運用向け）
config();
config({ path: '.env.local', override: true });

// APIハンドラーのインポート（必要なもののみ）
import createConnectPaymentIntent from './api/create-connect-payment-intent.js';
import createPaymentIntent from './api/create-payment-intent.js';
import createAccountLink from './api/create-account-link.js';
import getConnectedAccountStatus from './api/get-connected-account-status.js';
import getCheckoutSession from './api/get-checkout-session.js';
import getPaymentIntent from './api/get-payment-intent.js';
import createConnectedAccount from './api/create-connected-account.js';
import getConnectedAccount from './api/get-connected-account.js';
import paymentStatus from './api/payment-status.js';
import createProduct from './api/create-product.js';
import createSubscription from './api/create-subscription.js';
import transferToStore from './api/transfer-to-store.js';
import stripeWebhook from './api/stripe-webhook.js';
import geminiConcierge from './api/gemini-concierge.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// JSONパーサー（stripe-webhook以外のエンドポイント用）
// gemini-concierge は画像付きで JSON が大きくなる（既定 100kb だと PayloadTooLarge → 500）
app.use((req, res, next) => {
  // stripe-webhookはraw bodyが必要なため、JSONパーサーをスキップ
  if (req.path === '/api/stripe-webhook') {
    return next();
  }
  express.json({ limit: '32mb' })(req, res, next);
});

// raw bodyパーサー（stripe-webhook用）
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

// Vercelのサーバーレス関数形式に合わせたリクエスト/レスポンスオブジェクトを作成
function createVercelReqRes(req, res) {
  const vercelReq = {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    url: req.url,
    path: req.path
  };
  
  const vercelRes = {
    status: (code) => {
      res.status(code);
      return vercelRes;
    },
    json: (data) => {
      res.json(data);
    },
    setHeader: (name, value) => {
      res.setHeader(name, value);
    },
    getHeader: (name) => res.getHeader(name),
    end: () => {
      res.end();
    }
  };
  
  return { vercelReq, vercelRes };
}

// APIエンドポイントの登録
app.all('/api/create-connect-payment-intent', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/create-connect-payment-intent`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await createConnectPaymentIntent(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in create-connect-payment-intent:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/create-payment-intent', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/create-payment-intent`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await createPaymentIntent(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in create-payment-intent:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/create-account-link', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/create-account-link`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await createAccountLink(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in create-account-link:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/get-connected-account-status', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/get-connected-account-status`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await getConnectedAccountStatus(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in get-connected-account-status:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/get-checkout-session', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/get-checkout-session`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await getCheckoutSession(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in get-checkout-session:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/get-payment-intent', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/get-payment-intent`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await getPaymentIntent(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in get-payment-intent:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/create-connected-account', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/create-connected-account`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await createConnectedAccount(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in create-connected-account:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/get-connected-account', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/get-connected-account`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await getConnectedAccount(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in get-connected-account:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/payment-status', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/payment-status`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await paymentStatus(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in payment-status:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/create-product', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/create-product`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await createProduct(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in create-product:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/create-subscription', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/create-subscription`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await createSubscription(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in create-subscription:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

app.all('/api/transfer-to-store', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/transfer-to-store`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await transferToStore(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in transfer-to-store:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

// ヘルスは Vercel ラッパーを経由しない（Express 5 + cors との相性で 500 になるのを避ける）
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.all('/api/gemini-concierge', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /api/gemini-concierge`);
  try {
    const { vercelReq, vercelRes } = createVercelReqRes(req, res);
    await geminiConcierge(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in gemini-concierge:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false,
    });
  }
});

// stripe-webhookはraw bodyが必要なため、特別な処理
app.post('/api/stripe-webhook', async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/stripe-webhook`);
  try {
    // raw bodyをそのまま渡す
    const vercelReq = {
      method: req.method,
      headers: req.headers,
      body: req.body, // raw body
      query: req.query,
      url: req.url,
      path: req.path
    };
    
    const vercelRes = {
      status: (code) => {
        res.status(code);
        return vercelRes;
      },
      json: (data) => {
        res.json(data);
      },
      send: (data) => {
        res.send(data);
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
      end: () => {
        res.end();
      }
    };
    
    await stripeWebhook(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// /api で未捕捉エラー → HTML ではなく JSON（Vite プロキシ経由でもフロントがパースできる）
app.use((err, req, res, next) => {
  const isApi = typeof req.path === 'string' && req.path.startsWith('/api');
  if (isApi && !res.headersSent) {
    console.error('[server-local API]', req.method, req.path, err);
    res.status(500).json({
      success: false,
      error: err?.message || String(err),
    });
    return;
  }
  next(err);
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api/*`);
  console.log(`🔗 Make sure to set VITE_API_BASE_URL=http://localhost:${PORT} in your .env file`);
});
