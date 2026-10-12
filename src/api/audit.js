/**
 * 操作日志（真实接口）
 *   GET /api/admin/audit-logs?operator=&action=&target=&start_date=&end_date=&page=&size=
 * 注意：后端**只记写操作与导出**，读接口不记（列表查询不会出现在日志里）。
 */
import request from './request'

export const auditApi = {
  async list(params = {}) {
    const { operator, action, target, start_date, end_date, page = 1, size = 10 } = params
    const query = { page, size }
    if (operator) query.operator = operator
    if (action) query.action = action
    if (target) query.target = target
    if (start_date) query.start_date = start_date
    if (end_date) query.end_date = end_date

    const data = await request.get('/admin/audit-logs', { params: query })
    const raw = Array.isArray(data) ? data : (data.list || data.items || data.records || [])
    return {
      list: raw,
      total: Number(data && data.total != null ? data.total : raw.length),
      page: Number((data && data.page) || page),
      size: Number((data && data.size) || size)
    }
  }
}
