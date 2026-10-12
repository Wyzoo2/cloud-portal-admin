/**
 * 管理员账号管理（真实接口）
 *   GET  /api/admin/admins                  管理员列表（{list,total}，**无分页**）
 *   POST /api/admin/admins                  创建管理员
 *   POST /api/admin/admins/{id}/status      启用 / 禁用管理员
 *   POST /api/admin/admins/{id}/password    重置某管理员密码
 */
import request from './request'

export const adminApi = {
  async list() {
    const data = await request.get('/admin/admins')
    const raw = Array.isArray(data) ? data : (data.list || [])
    return { list: raw, total: Number(data && data.total != null ? data.total : raw.length) }
  },

  /** { username(4-32 字母/数字/下划线), password(8-64 含字母和数字), phone? } */
  async create(payload) {
    return request.post('/admin/admins', payload)
  },

  /** status：1 禁用 / 0 启用；不能禁用自己，也不能禁用最后一个可用管理员 */
  async setStatus(id, status) {
    return request.post(`/admin/admins/${id}/status`, { status })
  },

  /** 重置**他人**密码（改自己的密码走 /auth/password） */
  async resetPassword(id, new_password) {
    return request.post(`/admin/admins/${id}/password`, { new_password })
  }
}
