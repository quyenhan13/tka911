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
      // Đổi tất cả về localhost để bạn thấy phim trong máy mình
      '/api': {
        target: 'http://localhost/vteen',
        changeOrigin: true,
        secure: false,
      },
      '/embed.php': {
        target: 'http://localhost/vteen',
        changeOrigin: true,
        secure: false,
      },
      '/admin': {
        target: 'http://localhost/vteen',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost/vteen',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
