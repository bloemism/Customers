import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react'],
          qr: ['qrcode', 'qrcode.react', 'html5-qrcode'],
          stripe: ['@stripe/stripe-js'],
          maps: ['@googlemaps/js-api-loader']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
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
    host: true
  },
  preview: {
    port: 5173,
    host: true
  }
})
