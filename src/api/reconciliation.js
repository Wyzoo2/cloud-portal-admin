/** 日对账：daily 按产品分行返回差异汇总，detail 里是账单号数组 */
import request from './request'

/** detail 的三类差异（值是账单号字符串数组） */
const DIFF_KINDS = [
  { key: 'product_only', text: '仅产品侧有' },
  { key: 'portal_only', text: '仅门户侧有' },
  { key: 'amount_mismatch', text: '金额不一致' }
]

const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0)

function normalize(data, fallbackDate) {
  const root = data || {}
  const rows = Array.isArray(root) ? root : root.list || []

  const mismatches = []
  const products = rows.map(r => {
    const product_code = r.product_code || '-'
    const detail = r.detail || {}
    DIFF_KINDS.forEach(({ key, text }) => {
      const bills = detail[key]
      if (Array.isArray(bills)) {
        bills.forEach(no => mismatches.push({ product_code, bill_no: String(no), kind: text }))
      }
    })
    return {
      product_code,
      portal_cents: num(r.portal_amount_cents),
      product_cents: num(r.product_amount_cents),
      diff_cents: num(r.diff_cents),
      diff_count: num(r.diff_count),
      only_product: num(r.product_only_count),
      only_portal: num(r.portal_only_count),
      mismatch: num(r.amount_mismatch_count)
    }
  })

  const sum = fn => products.reduce((acc, p) => acc + fn(p), 0)
  return {
    date: root.date || (rows[0] && rows[0].biz_date) || fallbackDate || '',
    summary: {
      portal_total_cents: sum(p => p.portal_cents),
      product_total_cents: sum(p => p.product_cents),
      diff_cents: sum(p => p.diff_cents),
      only_product: sum(p => p.only_product),
      only_portal: sum(p => p.only_portal),
      mismatch: sum(p => p.mismatch)
    },
    products,
    mismatches
  }
}

export const reconciliationApi = {
  /** 不传 date 后端默认查前一日（UTC） */
  async daily(date) {
    const params = date ? { date } : {}
    return normalize(await request.get('/admin/reconciliation/daily', { params }), date)
  },

  /** 手动触发对账（补跑/排障）：biz_date + product_code 都必填 */
  run(biz_date, product_code) {
    return request.post('/admin/reconciliation/run', { biz_date, product_code })
  },

  /** 开通任务队列：0 待处理 / 1 处理中 / 2 成功 / 3 失败 */
  async provisionJobs() {
    const data = await request.get('/admin/reconciliation/provision-jobs')
    const stats = (data && data.stats) || {}
    return {
      pending: num(stats[0]),
      processing: num(stats[1]),
      success: num(stats[2]),
      failed: num(stats[3])
    }
  }
}
