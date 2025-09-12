import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,              // слушать 0.0.0.0
    port: 5173,
    // Разрешаем доступ с публичного домена туннеля:
    allowedHosts: [
      'c1dee0826e9e.ngrok-free.app',                 // <-- твой ngrok-домен
    ],
    // (рекомендовано) проксируем API, чтобы не плодить второй туннель:
    proxy: {
      '/api': {
        target: 'http://localhost:7002',
        changeOrigin: true
      }
    }
  }
})
