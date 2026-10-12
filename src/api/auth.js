/**
 * 认证（管理端走用户端同一套账号体系）
 *   POST /api/auth/login      用户名 + 密码登录
 *   GET  /api/admin/auth/verify  校验「这个账号能不能进管理端」
 *   POST /api/auth/logout     登出
 *   POST /api/auth/password   修改自己的密码
 */
import request from './request'

export const authApi = {
  /** 账号密码登录（与用户端共用）；成功返回 { access_token, expires_in, user } */
  login: (username, password) => request.post('/auth/login', { username, password }),

  /** 登录后判断是否管理员：code 0 可进；1004 = 该账号不是管理员 */
  verify: () => request.get('/admin/auth/verify'),

  logout: () => request.post('/auth/logout'),

  /** 改自己密码；成功后**全部会话（含当前设备）被吊销**，需重新登录 */
  changePassword: (old_password, new_password) =>
    request.post('/auth/password', { old_password, new_password })
}
