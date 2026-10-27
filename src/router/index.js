/** 路由：守卫按 token → 会话 → meta.permission 逐级校验 */
import { createRouter, createWebHistory } from 'vue-router'
import { PERM } from '../utils/constants'
import AdminLayout from '../layouts/AdminLayout.vue'
import Login from '../pages/login/Login.vue'
import Dashboard from '../pages/dashboard/Dashboard.vue'
import ApplicationList from '../pages/applications/ApplicationList.vue'
import EnterpriseList from '../pages/enterprises/EnterpriseList.vue'
import MyEnterprise from '../pages/enterprise/MyEnterprise.vue'
import MemberList from '../pages/members/MemberList.vue'
import RechargeList from '../pages/recharges/RechargeList.vue'
import UserList from '../pages/users/UserList.vue'
import TransactionList from '../pages/transactions/TransactionList.vue'
import Reconciliation from '../pages/reconciliation/Reconciliation.vue'
import AdminList from '../pages/admins/AdminList.vue'
import AuditLog from '../pages/audit/AuditLog.vue'

const TOKEN_KEY = 'portal_admin_token'
const SESSION_KEY = 'portal_admin_session'

export const router = createRouter({
  // base 跟随 vite 的 base（见 src/deploy.config.js）
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { public: true } },
    {
      path: '/',
      component: AdminLayout,
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'dashboard', component: Dashboard, meta: { title: '概览', desc: '运营数据一览' } },

        // —— 平台管理员 ——
        { path: 'applications', name: 'applications', component: ApplicationList, meta: { title: '企业审核', desc: '审核企业注册申请', permission: PERM.ENTERPRISE_REVIEW } },
        { path: 'enterprises', name: 'enterprises', component: EnterpriseList, meta: { title: '企业管理', desc: '企业列表与停用/启用', permission: PERM.ENTERPRISE_MANAGE } },
        { path: 'recharges', name: 'recharges', component: RechargeList, meta: { title: '充值核销', desc: '审核线下转账并确认到账', permission: PERM.RECHARGE_CONFIRM } },
        { path: 'users', name: 'users', component: UserList, meta: { title: '用户管理', desc: '查询与禁用用户', permission: PERM.USER_MANAGE } },
        { path: 'transactions', name: 'transactions', component: TransactionList, meta: { title: '交易流水', desc: '查询与导出 CSV', permission: PERM.TRANSACTION_READ } },
        { path: 'reconciliation', name: 'reconciliation', component: Reconciliation, meta: { title: '日对账', desc: '产品账单 vs 门户流水', permission: PERM.RECONCILIATION_READ } },
        { path: 'admins', name: 'admins', component: AdminList, meta: { title: '管理员管理', desc: '管理员账号与权限', permission: PERM.ADMIN_MANAGE } },
        { path: 'audit', name: 'audit', component: AuditLog, meta: { title: '操作日志', desc: '管理员操作留痕', permission: PERM.AUDIT_READ } },

        // —— 企业管理员 ——
        { path: 'enterprise', name: 'my-enterprise', component: MyEnterprise, meta: { title: '我的企业', desc: '本企业信息', permission: PERM.ENT_PROFILE_READ } },
        { path: 'members', name: 'members', component: MemberList, meta: { title: '员工管理', desc: '本企业员工账号', permission: PERM.ENT_MEMBER_READ } }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
  } catch (e) {
    return null
  }
}

/** 与服务端一致：平台管理员的 platform.* 视为全量开放 */
function can(perm) {
  if (!perm) return true
  const s = readSession()
  if (!s) return true // 会话尚未落地时先放行，页面请求会给出真实错误
  if (s.scope === 'platform' && perm.indexOf('platform.') === 0) return true
  return (s.permissions || []).includes(perm)
}

function homeOf(scope) {
  return scope === 'enterprise' ? { name: 'my-enterprise' } : { name: 'dashboard' }
}

router.beforeEach(to => {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (!to.meta.public && !token) return { name: 'login' }

  const s = readSession()
  if (to.name === 'login') return token ? homeOf(s && s.scope) : true

  if (!can(to.meta.permission)) return homeOf(s && s.scope)
})
