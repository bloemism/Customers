import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // ベンダーライブラリを分離
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react'],
          qr: ['qrcode', 'qrcode.react', 'html5-qrcode'],
          stripe: ['@stripe/stripe-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 警告閾値を1MBに設定
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
