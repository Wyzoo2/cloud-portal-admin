/** 控制台会话：一次拿到 scope + permissions */
import request from './request'

export const consoleApi = {
  session() {
    return request.get('/console/session')
  }
}
