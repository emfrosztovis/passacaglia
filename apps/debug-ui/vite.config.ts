import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/musicxml': {
        target: 'http://downloads2.makemusic.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/musicxml/, '')
      }
    }
  }
})
