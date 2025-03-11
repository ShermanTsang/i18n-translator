import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    hmr: {
      // Force full page reload when Tailwind classes change
      // This helps with JIT mode arbitrary values
      overlay: true,
    },
  },
})
