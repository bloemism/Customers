import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      mangle: {
        safari10: true
      }
    },
    target: 'es2020',
    cssCodeSplit: true
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
      '@googlemaps/js-api-loader'
    ],
    exclude: ['express', 'cors']
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false
    }
  },
  preview: {
    port: 5173,
    host: true
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})
