/**
 * 用户管理（真实接口）
 *   GET  /api/admin/users?keyword=&status=&page=&size=   用户列表（只含普通用户）
 *   POST /api/admin/users/{id}/status                    启用 / 禁用（合并接口）
 */
import request from './request'

/** 列表响应 → 统一分页结构 */
function toPage(data, fallback) {
  const raw = Array.isArray(data) ? data : (data && data.list) || []
  return {
    list: raw,
    total: Number((data && data.total) ?? raw.length),
    page: Number((data && data.page) ?? fallback.page),
    size: Number((data && data.size) ?? fallback.size)
  }
}

export const userApi = {
  async list({ keyword, status, page = 1, size = 10 } = {}) {
    const params = { page, size }
    if (keyword) params.keyword = keyword
    if (status !== '' && status !== undefined && status !== null) params.status = status
    const data = await request.get('/admin/users', { params })
    return toPage(data, { page, size })
  },

  /** status：1 禁用 / 0 恢复；reason 会写进审计日志 */
  setStatus(id, status, reason = '') {
    return request.post(`/admin/users/${id}/status`, { status, reason })
  }
}
