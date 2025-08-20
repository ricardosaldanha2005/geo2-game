import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), mkcert()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    port: 5173,
    https: {
      cert: undefined,
      key: undefined,
    },
  },
  preview: {
    host: true,
    port: 4173,
    https: {
      cert: undefined,
      key: undefined,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
