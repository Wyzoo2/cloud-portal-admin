/**
 * 展示工具函数：金额（分 → 元）、时间（UTC → 本地）
 */

/** 分 → 元；null / undefined 返回 '-' */
export function formatCents(cents) {
  if (cents === null || cents === undefined) return '-'
  return '¥' + (cents / 100).toFixed(2)
}

/** UTC ISO 字符串 → 本地时区；空值返回 '-' */
export function formatTime(iso, withSeconds = false) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = n => String(n).padStart(2, '0')
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  return withSeconds ? `${base}:${pad(d.getSeconds())}` : base
}

/** UTC ISO → 本地日期 YYYY-MM-DD（用于日期筛选/导出文件名） */
export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
