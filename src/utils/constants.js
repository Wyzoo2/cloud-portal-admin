/** 导航菜单（单一数组 + 权限点）与状态文案 */

/** 权限点（后端硬编码下发） */
export const PERM = {
  ENTERPRISE_REVIEW: 'platform.enterprise.review',
  ENTERPRISE_MANAGE: 'platform.enterprise.manage',
  USER_MANAGE: 'platform.user.manage',
  RECHARGE_CONFIRM: 'platform.recharge.confirm',
  TRANSACTION_READ: 'platform.transaction.read',
  RECONCILIATION_READ: 'platform.reconciliation.read',
  AUDIT_READ: 'platform.audit.read',
  ADMIN_MANAGE: 'platform.admin.manage',

  ENT_PROFILE_READ: 'enterprise.profile.read',
  ENT_MEMBER_READ: 'enterprise.member.read',
  ENT_MEMBER_WRITE: 'enterprise.member.write',
  ENT_MEMBER_RESET: 'enterprise.member.reset'
}

// 侧边菜单（分组结构，参考 vben）；无 permission 表示登录即可见
export const MENU = [
  { path: '/dashboard', label: '概览', icon: 'Odometer' },
  {
    label: '业务管理',
    icon: 'Sell',
    children: [
      { path: '/applications', label: '企业审核', permission: PERM.ENTERPRISE_REVIEW },
      { path: '/enterprises', label: '企业管理', permission: PERM.ENTERPRISE_MANAGE },
      { path: '/recharges', label: '充值核销', permission: PERM.RECHARGE_CONFIRM },
      { path: '/users', label: '用户管理', permission: PERM.USER_MANAGE }
    ]
  },
  {
    label: '财务中心',
    icon: 'Money',
    children: [
      { path: '/transactions', label: '交易流水', permission: PERM.TRANSACTION_READ },
      { path: '/reconciliation', label: '日对账', permission: PERM.RECONCILIATION_READ }
    ]
  },
  {
    label: '系统管理',
    icon: 'Setting',
    children: [
      { path: '/admins', label: '管理员管理', permission: PERM.ADMIN_MANAGE },
      { path: '/audit', label: '操作日志', permission: PERM.AUDIT_READ }
    ]
  },
  {
    // 企业管理员看到的唯一分组
    label: '企业',
    icon: 'OfficeBuilding',
    children: [
      { path: '/enterprise', label: '我的企业', permission: PERM.ENT_PROFILE_READ },
      { path: '/members', label: '员工管理', permission: PERM.ENT_MEMBER_READ }
    ]
  }
]

/** 按权限点裁剪菜单：子项过滤后为空的整组丢弃 */
export function filterMenu(menu, can) {
  const out = []
  menu.forEach(m => {
    if (m.children) {
      const kids = m.children.filter(c => can(c.permission))
      if (kids.length) out.push({ ...m, children: kids })
    } else if (can(m.permission)) {
      out.push({ ...m })
    }
  })
  return out
}

/** 扁平化菜单（搜索用）；子项继承父级图标 */
export function flattenMenu(menu = MENU) {
  const out = []
  menu.forEach(m => {
    if (m.path) out.push({ ...m })
    if (m.children) m.children.forEach(c => out.push({ ...c, icon: c.icon || m.icon }))
  })
  return out
}

// 充值单状态：0 待核销 · 1 已到账 · 2 已驳回
export const RECHARGE_STATUS = {
  0: { text: '待核销', type: 'warning' },
  1: { text: '已到账', type: 'success' },
  2: { text: '已驳回', type: 'danger' }
}

// 用户状态：0 正常 · 1 已禁用
export const USER_STATUS = {
  0: { text: '正常', type: 'success' },
  1: { text: '已禁用', type: 'danger' }
}

// 管理员账号状态（与用户状态同值，单独一份便于文案区分）
export const ADMIN_STATUS = {
  0: { text: '正常', type: 'success' },
  1: { text: '已禁用', type: 'danger' }
}

// 企业状态：pending 待审核 · active 已启用 · rejected 已驳回 · disabled 已停用
export const ENTERPRISE_STATUS = {
  pending: { text: '待审核', type: 'warning' },
  active: { text: '已启用', type: 'success' },
  rejected: { text: '已驳回', type: 'danger' },
  disabled: { text: '已停用', type: 'info' }
}

/** 企业状态筛选项 */
export const ENTERPRISE_STATUS_OPTIONS = [
  { value: 'pending', label: '待审核' },
  { value: 'active', label: '已启用' },
  { value: 'rejected', label: '已驳回' },
  { value: 'disabled', label: '已停用' }
]

// 流水类型：1 充值 · 2 扣费 · 3 退款 · 4 调账
export const TRANSACTION_TYPE = {
  1: { text: '充值', type: 'success', sign: '+' },
  2: { text: '扣费', type: 'info', sign: '-' },
  3: { text: '退款', type: 'warning', sign: '+' },
  4: { text: '调账', type: 'primary', sign: '±' }
}

// 产品代码 → 展示名
export const PRODUCT_NAME = {
  storage: '云存储',
  phone: '云手机',
  desktop: '云电脑'
}

// 操作日志 action → 中文（后端枚举，见《08-管理端改造说明》§4.5）
export const AUDIT_ACTION = {
  recharge_confirm: '核销充值',
  recharge_reject: '驳回充值',
  user_disable: '禁用用户',
  user_enable: '恢复用户',
  admin_create: '创建管理员',
  admin_disable: '禁用管理员',
  admin_enable: '启用管理员',
  admin_password_reset: '重置管理员密码',
  password_change: '修改密码',
  transaction_export: '导出流水',
  reconciliation_run: '手动对账',
  system_bootstrap: '系统初始化',
  wallet_adjust: '人工调账'
}

/** 操作日志筛选项 */
export const AUDIT_ACTION_OPTIONS = Object.keys(AUDIT_ACTION).map(k => ({
  value: k,
  label: AUDIT_ACTION[k]
}))
