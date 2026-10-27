/** 企业管理（平台侧）：列表 / 审核通过·驳回 / 停用启用 */
import request from './request'

function normalize(raw) {
  if (!raw) return raw
  return {
    id: String(raw.id ?? ''),
    code: raw.code || '-',
    name: raw.name || '-',
    status: raw.status || '',
    owner_user_id: raw.owner_user_id || null,
    owner_username: raw.owner_username || '',
    contact_name: raw.contact_name || '',
    contact_phone: raw.contact_phone || '',
    remark: raw.remark || '',
    reject_reason: raw.reject_reason || '',
    reviewed_at: raw.reviewed_at || null,
    reviewed_by_username: raw.reviewed_by_username || '',
    member_count: raw.member_count == null ? null : Number(raw.member_count),
    expire_at: raw.expire_at || null,
    created_at: raw.created_at || ''
  }
}

export const enterpriseApi = {
  async list({ status, keyword, page = 1, size = 10 } = {}) {
    const params = { page, size }
    if (status) params.status = status
    if (keyword) params.keyword = keyword
    const data = await request.get('/admin/enterprises', { params })
    const raw = Array.isArray(data) ? data : (data && data.list) || []
    const list = raw.map(normalize)
    return {
      list,
      total: Number((data && data.total) ?? list.length),
      page: Number((data && data.page) ?? page),
      size: Number((data && data.size) ?? size)
    }
  },

  /** 审核通过：pending → active */
  approve(id) {
    return request.post(`/admin/enterprises/${id}/approve`)
  },

  /** 审核驳回：pending → rejected，原因必填 */
  reject(id, reason) {
    return request.post(`/admin/enterprises/${id}/reject`, { reason })
  },

  /** 停用 / 启用：status = 'active' | 'disabled' */
  setStatus(id, status) {
    return request.post(`/admin/enterprises/${id}/status`, { status })
  }
}
