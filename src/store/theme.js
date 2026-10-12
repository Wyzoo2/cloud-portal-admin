/**
 * 主题切换（pinia）：深色 / 浅色
 * 通过给 <html> 加 .dark 类 + Element Plus 暗色变量实现，刷新后保持。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'portal_admin_theme'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref(document.documentElement.classList.contains('dark') ? 'dark' : 'light')

  function apply(m) {
    document.documentElement.classList.toggle('dark', m === 'dark')
  }

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
    apply(mode.value)
    localStorage.setItem(KEY, mode.value)
  }

  function setMode(m) {
    mode.value = m === 'dark' ? 'dark' : 'light'
    apply(mode.value)
    localStorage.setItem(KEY, mode.value)
  }

  return { mode, toggle, setMode }
})
