import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * - `npm run dev`: base は `/`（localhost:5174/ で確実に表示される）
 * - `npm run build`: 既定は相対 `./`（GitHub Pages 等）。上書きは VITE_BASE_PATH
 */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base:
    command === 'serve'
      ? '/'
      : (process.env.VITE_BASE_PATH ?? './'),
  /** 親ディレクトリの PostCSS/Tailwind を読まない */
  css: {
    postcss: {},
  },
  server: {
    port: 5174,
    host: true,
    open: true,
  },
  preview: {
    port: 4174,
  },
}));
