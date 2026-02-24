import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: parseInt(env.FRONTEND_PORT) || 5173,
      proxy: {
        // 股票AI分析服务 (Node.js server, 通过 hiapi.online 调用 Gemini)
        '/api/v1/stocks': {
          target: `http://localhost:${env.API_PORT || 3001}`,
          changeOrigin: true,
          rewrite: (path) => path
        },
        // ETF数据服务 (Python FastAPI @ port 8001)
        '/api/etf': {
          target: env.VITE_ETF_API_URL || 'http://localhost:8001',
          changeOrigin: true,
          rewrite: (path) => path
        },
        // 其他API (Node.js backend @ port 3001)
        '/api': {
          target: `http://localhost:${env.API_PORT || 3001}`,
          changeOrigin: true
        }
      }
    }
  }
})
