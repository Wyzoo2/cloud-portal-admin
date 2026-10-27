import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { MOUNT_BASE, API_BASE } from './src/deploy.config.js'

// 云平台统一门户 · 管理端（内网，端口 5174 避免与用户端 5173 冲突）
// 开发代理：/api → 门户后端。前端 baseURL 保持相对路径 '/api'，浏览器视为同源：
//   1) Authorization 头不会触发 CORS 预检
//   2) refresh_token 是 SameSite=Strict 的 HttpOnly Cookie，跨站根本不会带上——
//      走代理同源才能刷新 token，**不要改成直连后端**。
const API_TARGET = 'http://192.168.9.105:3000'

console.log(`[vite] ${API_BASE}  →  ${API_TARGET}（base ${MOUNT_BASE}）`)

export default defineConfig({
  base: MOUNT_BASE,
  plugins: [vue()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true
      },
      // 生产接口前缀 /portal/api；转发时剥掉 /portal（后端若配了 context-path=/portal 则删掉 rewrite）
      '/portal/api': {
        target: API_TARGET,
        changeOrigin: true,
        // rewrite: p => p.replace(/^\/portal/, '')
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
