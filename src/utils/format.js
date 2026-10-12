/**
 * 展示工具函数：金额（分 → 元）、时间格式化
 *
 * ⚠️ 时间**不做时区换算**：后端返回 UTC，前端原样展示（用 getUTC* 取值）。
 *    否则在 UTC+8 机器上会整体 +8 小时，与后端数据、对账口径对不上。
 */

/** 分 → 元；null / undefined 返回 '-' */
export function formatCents(cents) {
  if (cents === null || cents === undefined) return '-'
  return '¥' + (cents / 100).toFixed(2)
}

const pad = n => String(n).padStart(2, '0')

/** UTC ISO 字符串 → 原样格式化（不转本地时区）；空值返回 '-' */
export function formatTime(iso, withSeconds = false) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const base = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  return withSeconds ? `${base}:${pad(d.getUTCSeconds())}` : base
}

/** UTC ISO → YYYY-MM-DD（同样不换算时区，用于业务日筛选与展示） */
export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** 本机「今天」的日期，仅用于界面问候语（不是后端数据） */
export function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
