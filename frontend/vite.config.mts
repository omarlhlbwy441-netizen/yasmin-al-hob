import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'https://yasmin-al-hob-production.up.railway.app',
      '/ws': {
        target: 'wss://yasmin-al-hob-production.up.railway.app',
        ws: true,
      },
    },
  },
  preview: {
    allowedHosts: [
      'yasmin-al-hob-production.up.railway.app'
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})