/** 控制台登录态：scope / permissions 来自 /api/console/session */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'
import { consoleApi } from '../api/console'
import { TOKEN_KEY, USER_KEY } from '../api/request'

export const SESSION_KEY = 'portal_admin_session'

/** 各 scope 的落地页 */
const HOME = {
  platform: '/dashboard',
  enterprise: '/enterprise'
}

function parse(json) {
  try {
    return JSON.parse(json || 'null')
  } catch (e) {
    return null
  }
}

export const useSessionStore = defineStore('session', () => {
  const user = ref(parse(sessionStorage.getItem(USER_KEY)))
  const session = ref(parse(sessionStorage.getItem(SESSION_KEY)))

  const operator = computed(
    () => (session.value && session.value.operator) || (user.value && user.value.username) || ''
  )
  const scope = computed(() => (session.value && session.value.scope) || '')
  const permissions = computed(() => (session.value && session.value.permissions) || [])
  const enterprise = computed(() => (session.value && session.value.enterprise) || null)
  const isPlatform = computed(() => scope.value === 'platform')

  /** 传空 = 登录即可见；平台管理员的 platform.* 视为全量 */
  function hasPerm(p) {
    if (!p) return true // 没配权限点 = 登录即可见
    if (typeof p !== 'string') return false // 传错类型时按"无权"处理，避免把菜单全放开
    if (scope.value === 'platform' && p.indexOf('platform.') === 0) return true
    return permissions.value.includes(p)
  }

  function persist(token, userInfo, sess) {
    user.value = userInfo || null
    session.value = sess || null

    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)

    if (userInfo) sessionStorage.setItem(USER_KEY, JSON.stringify(userInfo))
    else sessionStorage.removeItem(USER_KEY)

    if (sess) sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess))
    else sessionStorage.removeItem(SESSION_KEY)
  }

  /** 拉会话；接口缺失时给出可读提示 */
  async function fetchSession() {
    try {
      return await consoleApi.session()
    } catch (e) {
      const msg = (e && e.message) || ''
      if (msg.indexOf('404') >= 0) {
        throw { code: -1, message: '后端未提供 GET /api/console/session（404），暂时无法进入管理端' }
      }
      throw e
    }
  }

  /** 登录：账号密码 → 拿会话 → 返回落地页 */
  async function login(username, password) {
    const res = await authApi.login(username, password)
    // 先落 token，会话请求要用它
    persist(res.access_token, res.user || null, null)
    let sess
    try {
      sess = await fetchSession()
    } catch (e) {
      persist('', null, null)
      throw e
    }
    persist(res.access_token, res.user || null, sess)
    return { scope: sess.scope, home: HOME[sess.scope] || '/dashboard' }
  }

  function logout() {
    authApi.logout().catch(() => {})
    persist('', null, null)
  }

  return { user, session, operator, scope, permissions, enterprise, isPlatform, hasPerm, login, logout }
})
