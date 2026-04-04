import { resolve } from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { geminiDevMiddleware } from './vite/geminiDevMiddleware'

/** Vite の dev サーバー（Node）が .env を確実に読む（loadEnv だけだと GEMINI_* が空の環境がある） */
function hydrateGeminiEnvFromFiles(rootDir: string, mode: string) {
  dotenvConfig({ path: resolve(rootDir, '.env') })
  dotenvConfig({ path: resolve(rootDir, '.env.local'), override: true })
  dotenvConfig({ path: resolve(rootDir, `.env.${mode}`), override: true })
  dotenvConfig({ path: resolve(rootDir, `.env.${mode}.local`), override: true })
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  /** AI コンシェルジュ用プロキシ先（未設定時はローカル API 想定） */
  const conciergeProxyTarget = (
    env.VITE_API_BASE_URL || 'http://localhost:3000'
  ).replace(/\/$/, '')
  /** Deployment Protection 回避（Vercel の Automation Bypass の値。クライアントには出さない） */
  const protectionBypass = process.env.VERCEL_PROTECTION_BYPASS || ''

  return {
    plugins: [
      {
        name: 'gemini-dev-node-proxy',
        configureServer(server) {
          const rootDir = server.config.root
          const mode = server.config.mode
          hydrateGeminiEnvFromFiles(rootDir, mode)
          const merged = loadEnv(mode, rootDir, '')
          for (const key of ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY', 'GEMINI_MODEL'] as const) {
            const v = merged[key] ?? process.env[key]
            if (typeof v === 'string' && v.trim() !== '') {
              process.env[key] = v.trim()
            }
          }
          server.middlewares.use(geminiDevMiddleware())
        },
      },
      react(),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // React関連
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react'
            }
            // ルーター
            if (id.includes('react-router-dom')) {
              return 'router'
            }
            // Supabase
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase'
            }
            // UIライブラリ
            if (id.includes('lucide-react')) {
              return 'ui'
            }
            // QRコード関連（大きなライブラリを分離）
            if (id.includes('qrcode') || id.includes('html5-qrcode')) {
              return 'qr'
            }
            // Stripe
            if (id.includes('@stripe/stripe-js')) {
              return 'stripe'
            }
            // Google Maps（使用時のみチャンク化）
            if (id.includes('@googlemaps/js-api-loader')) {
              return 'maps'
            }
            // その他のnode_modules
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        },
        mangle: {
          safari10: true,
        },
      },
      target: 'es2020',
      cssCodeSplit: true,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'lucide-react',
        'qrcode',
        'qrcode.react',
        'html5-qrcode',
        '@stripe/stripe-js',
        '@googlemaps/js-api-loader',
      ],
      exclude: ['express', 'cors'],
    },
    server: {
      port: 5173,
      host: true,
      hmr: {
        overlay: false,
      },
      proxy: {
        // ローカル dev: /api/* を API サーバーへ（gemini のみでなく health 等も同じオリジンで届く）
        '/api': {
          target: conciergeProxyTarget,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (protectionBypass) {
                proxyReq.setHeader('x-vercel-protection-bypass', protectionBypass)
              }
            })
            proxy.on('error', (err) => {
              console.error('[vite proxy /api]', err.message)
            })
          },
        },
      },
    },
    preview: {
      port: 5173,
      host: true,
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  }
})
