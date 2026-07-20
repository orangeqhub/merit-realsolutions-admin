import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createDevServerConfig } from './vite.proxy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3002'

  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-hook-form', 'react-router-dom', 'react-icons'],
      alias: {
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    server: createDevServerConfig(apiTarget),
  }
})
