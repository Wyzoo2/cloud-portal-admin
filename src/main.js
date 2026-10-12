/**
 * 入口：注册 pinia / 路由 / Element Plus，挂载 App
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import { router } from './router'
import './assets/main.css'

// 初始化主题（避免刷新时闪一下浅色）
if (localStorage.getItem('portal_admin_theme') === 'dark') {
  document.documentElement.classList.add('dark')
}

createApp(App)
  .use(createPinia())
  .use(router)
  .use(ElementPlus, { locale: zhCn })
  .mount('#app')
