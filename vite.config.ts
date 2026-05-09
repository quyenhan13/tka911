import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://vteen.shop',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      '/__vteen': {
        target: 'https://vteen.shop',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/__vteen/, ''),
      },
    },
  },
})
