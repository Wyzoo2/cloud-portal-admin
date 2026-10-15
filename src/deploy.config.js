// 部署形态开关：false = 测试（根路径 + /api）；true = 生产统一门户（挂 /admin/ + 接口 /portal/api）
export const MOUNTED = false

export const MOUNT_BASE = MOUNTED ? '/admin/' : '/'

export const API_BASE = MOUNTED ? '/portal/api' : '/api'
