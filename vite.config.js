import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 云平台统一门户 · 管理端（内网，端口 5174 避免与用户端 5173 冲突）
// 开发代理：/api → 门户后端。前端 baseURL 保持相对路径 '/api'，浏览器视为同源：
//   1) Authorization 头不会触发 CORS 预检
//   2) refresh_token 是 SameSite=Strict 的 HttpOnly Cookie，跨站根本不会带上——
//      走代理同源才能刷新 token，**不要改成直连后端**。
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://192.168.9.105:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
