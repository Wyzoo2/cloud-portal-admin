/**
 * 交易流水（真实接口）
 *   GET /api/admin/transactions?type=&product_code=&user_id=&keyword=&start_date=&end_date=&page=&size=
 *   GET /api/admin/transactions/export?start_date=&end_date=&limit=&type=&product_code=  → 裸 CSV（带 BOM）
 */
import request from './request'

function buildParams(o = {}) {
  const p = {}
  if (o.type !== '' && o.type !== undefined && o.type !== null) p.type = o.type
  if (o.product_code) p.product_code = o.product_code
  if (o.user_id) p.user_id = o.user_id
  if (o.keyword) p.keyword = o.keyword
  if (o.start_date) p.start_date = o.start_date
  if (o.end_date) p.end_date = o.end_date
  return p
}

export const transactionApi = {
  async list(params = {}) {
    const { page = 1, size = 10 } = params
    const data = await request.get('/admin/transactions', {
      params: { ...buildParams(params), page, size }
    })
    const raw = Array.isArray(data) ? data : (data.list || data.items || data.records || [])
    return {
      list: raw,
      total: Number(data && data.total != null ? data.total : raw.length),
      page: Number((data && data.page) || page),
      size: Number((data && data.size) || size)
    }
  },

  /** 导出 CSV（后端直接返回文件流，带 BOM，默认 limit 5000 / 上限 50000） */
  async exportCsv(params = {}) {
    const query = buildParams(params)
    if (params.limit) query.limit = params.limit
    const resp = await request.get('/admin/transactions/export', {
      params: query,
      responseType: 'blob'
    })
    const blob = resp.data

    // 若后端返回的其实是 JSON（例如鉴权失败 / 参数错），转成业务错误抛出
    if (blob && blob.type && blob.type.includes('json')) {
      const text = await blob.text()
      let parsed = null
      try { parsed = JSON.parse(text) } catch (e) { /* ignore */ }
      throw parsed || { code: 5001, message: '导出失败' }
    }

    let filename = `流水导出_${new Date().toISOString().slice(0, 10)}.csv`
    const cd = resp.headers && (resp.headers['content-disposition'] || resp.headers['Content-Disposition'])
    if (cd) {
      const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd)
      if (m && m[1]) filename = decodeURIComponent(m[1])
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return { filename }
  }
}
