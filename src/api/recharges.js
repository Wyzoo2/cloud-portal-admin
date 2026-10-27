/** 充值核销 */
import request from './request'

function normalize(raw) {
  if (!raw) return raw
  return {
    apply_id: String(raw.apply_id ?? ''),
    user_id: raw.user_id ?? '',
    username: raw.username || '-',
    phone: raw.phone || '-',
    amount_cents: Number(raw.amount_cents ?? 0),
    remark: raw.remark || '-',
    status: Number(raw.status ?? 0),
    reviewed_at: raw.reviewed_at ?? null,
    reviewed_by_username: raw.reviewed_by_username ?? null,
    reject_reason: raw.reject_reason ?? null,
    created_at: raw.created_at ?? ''
  }
}

/** 列表响应 → 统一分页结构 */
function toPage(data, fallback) {
  const raw = Array.isArray(data) ? data : (data && data.list) || []
  const list = raw.map(normalize)
  return {
    list,
    total: Number((data && data.total) ?? list.length),
    page: Number((data && data.page) ?? fallback.page),
    size: Number((data && data.size) ?? fallback.size)
  }
}

export const rechargeApi = {
  list({ status, page = 1, size = 10 } = {}) {
    const params = { page, size }
    if (status !== '' && status !== undefined && status !== null) params.status = status
    return request.get('/admin/recharges', { params }).then(d => toPage(d, { page, size }))
  },

  /** 核销 / 驳回；后端用 WHERE status=0 抢占，重复核销会被拒（4002） */
  confirm(id, { reject = false, reason = '' } = {}) {
    return request.post(`/admin/recharges/${id}/confirm`, { reject, reason })
  },

  /** 某状态的单数：没有独立 count 接口，取 total */
  countByStatus(status) {
    return request
      .get('/admin/recharges', { params: { status, page: 1, size: 1 } })
      .then(d => Number((d && d.total) ?? 0))
  },

  /** 待核销数量（顶栏角标 / 概览） */
  pendingCount() {
    return rechargeApi.countByStatus(0)
  }
}
