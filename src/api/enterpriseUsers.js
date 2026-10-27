/** 企业员工管理（企业管理员）：列表 / 新建 / 重置密码 / 停用恢复 */
import request from './request'

export const enterpriseUserApi = {
  async list({ keyword, page = 1, size = 10 } = {}) {
    const params = { page, size }
    if (keyword) params.keyword = keyword
    const data = await request.get('/enterprise/users', { params })
    const raw = Array.isArray(data) ? data : (data && data.list) || []
    return {
      list: raw,
      total: Number((data && data.total) ?? raw.length),
      page: Number((data && data.page) ?? page),
      size: Number((data && data.size) ?? size)
    }
  },

  /** { username, phone? } —— 初始密码由后端生成，只在创建响应里返回 */
  create(payload) {
    return request.post('/enterprise/users', payload)
  },

  /** 无请求体；返回新的 initial_password */
  resetPassword(id) {
    return request.post(`/enterprise/users/${id}/reset-password`)
  },

  /** status：0 正常 / 1 禁用（企业管理员自己不可被停用） */
  setStatus(id, status) {
    return request.post(`/enterprise/users/${id}/status`, { status })
  }
}
