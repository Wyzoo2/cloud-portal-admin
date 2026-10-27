/** 错误码 → 提示文案 */

const ERROR_MESSAGES = {
  1001: '参数校验失败',
  1002: '请先登录',
  1003: '登录已过期',
  1004: '无管理权限',
  2001: '用户名已存在',
  2002: '手机号已注册',
  2003: '账号或密码错误',
  2004: '账号已被禁用，请联系平台',
  2007: '企业不存在或已停用',
  2008: '该账号已属于其他企业',
  2009: '该企业已有所有者，请先移交',
  2010: '该操作仅企业管理员可执行',
  2011: '企业注册待审核',
  2012: '企业注册未通过',
  2013: '企业编码已存在',
  2014: '企业管理员账号已被占用',
  4001: '目标不存在',
  4002: '状态不允许该操作',
  5001: '服务开小差了，请稍后重试'
}

/** 1001 的 data.errors 是字符串数组 */
function errorDetail(e) {
  const errors = e && e.data && e.data.errors
  if (Array.isArray(errors)) return errors.join('；')
  if (typeof errors === 'string') return errors
  return ''
}

/** 业务错误 → 展示文案：字段级明细优先，其次错误码文案，最后后端 message */
export function errorText(e) {
  if (!e) return '请求失败，请稍后重试'
  if (e.code != null) {
    return errorDetail(e) || ERROR_MESSAGES[e.code] || e.message || '请求失败，请稍后重试'
  }
  return e.message || '请求失败，请稍后重试'
}
