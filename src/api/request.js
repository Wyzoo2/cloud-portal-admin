/**
 * axios 封装（管理端 · 账号登录版）
 *  鉴权：Authorization: Bearer <access_token>（存 sessionStorage）
 *  过期：1003 → 单例 refresh 后重放原请求
 *  未登录：1002 → 回登录页
 *  无权限：1004 → 只提示，**不跳登录页**（已登录但不是管理员）
 *  刷新：refresh_token 是 HttpOnly Cookie，需 withCredentials
 *  CSV 等非 JSON 响应（responseType: blob）原样透传
 */
import axios from 'axios'
import { router } from '../router'
import { API_BASE } from '../deploy.config'
export const TOKEN_KEY = 'portal_admin_token'
export const USER_KEY = 'portal_admin_user'

export const request = axios.create({
  // 前缀由 src/deploy.config.js 的 MOUNTED 切换（/api ↔ /portal/api）
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true
})

request.interceptors.request.use(cfg => {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (token && !cfg.headers.Authorization) cfg.headers.Authorization = 'Bearer ' + token
  return cfg
})

/** 1003 刷新：并发只打一次 refresh，其余请求等同一个 Promise */
let refreshing = null
function refreshOnce() {
  if (!refreshing) {
    refreshing = axios
      .post(`${API_BASE}/auth/refresh`, null, { withCredentials: true, timeout: 30000 })
      .then(res => {
        const body = res.data
        if (!body || body.code !== 0) throw body || new Error('refresh failed')
        const token = body.data.access_token
        sessionStorage.setItem(TOKEN_KEY, token)
        if (body.data.user) sessionStorage.setItem(USER_KEY, JSON.stringify(body.data.user))
        return token
      })
      .finally(() => { refreshing = null })
  }
  return refreshing
}

function toLogin() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  // if (location.pathname !== '/login') location.href = '/login'
  if (router.currentRoute.value.path !== '/login') router.push('/login')
}

request.interceptors.response.use(
  async resp => {
    // CSV 等非 JSON 响应原样返回
    if (resp.config && resp.config.responseType === 'blob') return resp

    const body = resp.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data

      // 1003 token 过期 → 刷新后重放一次
      if (body.code === 1003 && !resp.config.__retried) {
        resp.config.__retried = true
        try {
          const token = await refreshOnce()
          resp.config.headers = resp.config.headers || {}
          resp.config.headers.Authorization = 'Bearer ' + token
          return request(resp.config)
        } catch (e) {
          toLogin()
          return Promise.reject({ code: 1002, message: '登录已过期，请重新登录' })
        }
      }

      // 1002 未登录 / token 无效 → 回登录页
      if (body.code === 1002) toLogin()

      // 1004 已登录但不是管理员 → 不跳登录页，交给页面提示
      return Promise.reject(body)
    }
    return body
  },
  err => {
    const msg = (err.response && err.response.data && err.response.data.message)
      || (err.code === 'ECONNABORTED' ? '请求超时（后端响应较慢，请重试）' : '')
      || (err.message === 'Network Error' ? '无法连接后端服务' : err.message)
    return Promise.reject(new Error(msg))
  }
)

export default request
