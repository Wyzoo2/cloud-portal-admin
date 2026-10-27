/** 主题切换：给 <html> 加 .dark 类，刷新后保持 */
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
