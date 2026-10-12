/**
 * 管理端登录态（pinia）
 * access token 存 sessionStorage（不用 localStorage，也不进打包产物）；
 * 路由守卫与请求拦截器直接读 sessionStorage，这里只维护页面要用的用户信息。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'
import { TOKEN_KEY, USER_KEY } from '../api/request'

export const useAuthStore = defineStore('admin', () => {
  const user = ref(JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'))

  /** 当前操作人（管理员用户名） */
  const operator = computed(() => (user.value && user.value.username) || '')

  function setSession(accessToken, userInfo) {
    user.value = userInfo || null
    if (accessToken) sessionStorage.setItem(TOKEN_KEY, accessToken)
    else sessionStorage.removeItem(TOKEN_KEY)
    if (userInfo) sessionStorage.setItem(USER_KEY, JSON.stringify(userInfo))
    else sessionStorage.removeItem(USER_KEY)
  }

  /** 登录：账号密码 → 再验管理员身份（非管理员直接拒绝进入） */
  async function login(username, password) {
    const res = await authApi.login(username, password)
    setSession(res.access_token, res.user || null)
    try {
      const info = await authApi.verify()
      return { operator: info.operator || (res.user && res.user.username) || '' }
    } catch (e) {
      // 1004 = 不是管理员：清掉会话，不让进
      setSession('', null)
      if (e && e.code === 1004) throw { code: 1004, message: '该账号不是管理员' }
      throw e
    }
  }

  function logout() {
    authApi.logout().catch(() => {})
    setSession('', null)
  }

  return { user, operator, login, logout, setSession }
})
