import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createDevServerConfig } from './vite.proxy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://187.127.163.100:3400'

  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-hook-form', 'react-router-dom', 'react-icons', 'react-leaflet', 'leaflet'],
      alias: {
        '@shared': path.resolve(__dirname, 'shared'),
        '@map-rendering': path.resolve(__dirname, '../shared/rendering'),
        leaflet: path.resolve(__dirname, 'node_modules/leaflet'),
        'react-leaflet': path.resolve(__dirname, 'node_modules/react-leaflet'),
      },
    },
    optimizeDeps: {
      include: ['leaflet', 'react-leaflet', 'xlsx'],
    },
    server: {
      ...createDevServerConfig(apiTarget),
      fs: {
        allow: [path.resolve(__dirname, '..')],
      },
    },
  }
})
