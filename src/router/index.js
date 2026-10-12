/**
 * 路由（vue-router@4）
 * 守卫：无 token 只能去 /login；有 token 访问 /login 跳回概览
 */
import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import Login from '../pages/login/Login.vue'
import Dashboard from '../pages/dashboard/Dashboard.vue'
import RechargeList from '../pages/recharges/RechargeList.vue'
import UserList from '../pages/users/UserList.vue'
import TransactionList from '../pages/transactions/TransactionList.vue'
import Reconciliation from '../pages/reconciliation/Reconciliation.vue'
import AdminList from '../pages/admins/AdminList.vue'
import AuditLog from '../pages/audit/AuditLog.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { public: true } },
    {
      path: '/',
      component: AdminLayout,
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'dashboard', component: Dashboard, meta: { title: '概览', desc: '平台运营数据一览' } },
        { path: 'recharges', name: 'recharges', component: RechargeList, meta: { title: '充值核销', desc: '审核线下转账并确认到账' } },
        { path: 'users', name: 'users', component: UserList, meta: { title: '用户管理', desc: '查询与禁用用户' } },
        { path: 'transactions', name: 'transactions', component: TransactionList, meta: { title: '交易流水', desc: '查询与导出 CSV' } },
        { path: 'reconciliation', name: 'reconciliation', component: Reconciliation, meta: { title: '日对账', desc: '产品账单 vs 门户流水' } },
        { path: 'admins', name: 'admins', component: AdminList, meta: { title: '管理员管理', desc: '管理员账号与权限' } },
        { path: 'audit', name: 'audit', component: AuditLog, meta: { title: '操作日志', desc: '管理员操作留痕' } }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

router.beforeEach(to => {
  const token = sessionStorage.getItem('portal_admin_token')
  if (!to.meta.public && !token) return { name: 'login' }
  if (to.name === 'login' && token) return { name: 'dashboard' }
})
