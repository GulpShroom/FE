import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('error', (error, _request, response) => {
            console.error('[api proxy]', error.message)
            if (!response || response.headersSent || typeof response.writeHead !== 'function') return
            response.writeHead(502, { 'Content-Type': 'application/json' })
            response.end(
              JSON.stringify({
                code: 'E502',
                message: '백엔드 서버에 연결하지 못했습니다. API 서버가 켜져 있는지 확인해 주세요.',
                data: null,
                errors: null,
                timestamp: new Date().toISOString(),
              }),
            )
          })
        },
      },
    },
  },
})
