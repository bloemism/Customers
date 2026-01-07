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

// 環境変数の読み込み（.envファイルから）
config();

// APIハンドラーのインポート（必要なもののみ）
import createConnectPaymentIntent from './api/create-connect-payment-intent.js';
import createPaymentIntent from './api/create-payment-intent.js';
import createAccountLink from './api/create-account-link.js';
import getConnectedAccountStatus from './api/get-connected-account-status.js';
import getCheckoutSession from './api/get-checkout-session.js';
import getPaymentIntent from './api/get-payment-intent.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// JSONパーサー
app.use(express.json());

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

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api/*`);
  console.log(`🔗 Make sure to set VITE_API_BASE_URL=http://localhost:${PORT} in your .env file`);
});
