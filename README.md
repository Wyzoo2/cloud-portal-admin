# 云平台统一门户 · 管理端

面向运营人员的管理后台（独立仓库，与用户端分开）。

- 技术栈：**Vue 3 + Vite + JavaScript（无 TypeScript）+ vue-router 4 + pinia + Element Plus**
- 结构参考 `D:\Burning_Inquiry\admin-web`（`layouts/` + `pages/` 按域分组 + `api/` 按域 + `types`）
- 主题：中性单色（近黑 `#111111`，Notion 温白底），专业克制
- **数据目前为 mock**（`src/mock/data.js`），后端就绪后替换 `src/api/*` 即可，页面无需改动
- **已适配移动端**（侧边栏 → 抽屉；表格横向滚动；筛选换行）

## 环境要求

Node.js ≥ 18（本机 v24 已验证）

## 快速开始

```bash
npm install
npm run dev     # → http://localhost:5174
npm run build   # → dist/
```

**演示密钥：`admin2026`**（登录页有提示）

## 功能清单

| 页面 | 路径 | 功能 |
|---|---|---|
| 概览 | `/dashboard` | 待核销数 / 用户总数 / 流水总数 / 今日新增充值 |
| 充值核销 | `/recharges` | 状态筛选 + 核销/驳回（二次确认 + 驳回理由） |
| 用户管理 | `/users` | 搜索 + 禁用/恢复 |
| 交易流水 | `/transactions` | 产品/日期筛选 + 导出 CSV（带 BOM） |
| 日对账 | `/reconciliation` | 汇总 + 差异明细 |
| 操作日志 | `/audit` | 运维操作留痕 |

所有列表**默认每页 10 条**。

## 目录结构

```
cloud-portal-admin/
├─ index.html
├─ vite.config.js            # 端口 5174
├─ public/favicon.svg
└─ src/
   ├─ main.js                # 入口
   ├─ App.vue
   ├─ assets/main.css        # 主题 token（浅色 #1677ff / 深色 #4096ff）
   ├─ api/                   # 按域划分，全部真实请求
   │  ├─ request.js          # axios 封装：Bearer + 1002/1003/1004 分流
   │  ├─ auth.js  admins.js  recharges.js  users.js
   │  ├─ transactions.js  reconciliation.js  audit.js
   ├─ router/index.js        # 路由 + token 守卫
   ├─ store/auth.js          # pinia：access_token + user（sessionStorage）
   ├─ layouts/AdminLayout.vue
   ├─ components/StatusTag.vue
   ├─ utils/format.js  constants.js  errors.js
   └─ pages/
      ├─ login/ dashboard/
      ├─ recharges/ users/ transactions/
      ├─ reconciliation/ admins/ audit/ profile/
```

## 鉴权（round 4 起：管理员账号）

> 依据《08-管理端改造说明.md》。旧的静态 `X-Admin-Key` **已废弃**，后端不再识别。

| 项 | 说明 |
|---|---|
| 登录 | `POST /api/auth/login`（**与用户端同一接口**），账号密码 |
| 鉴权头 | `Authorization: Bearer <access_token>` |
| 会话 | access token 2h 过期；`refresh_token` 是 HttpOnly Cookie（`SameSite=Strict`，靠 Vite 代理同源才能带上） |
| 存哪 | `sessionStorage`（不用 localStorage、不进打包产物） |
| 操作人 | **后端从 JWT 取**，前端不再传 `admin_id` |

**三个错误码处理完全不同**（见 `src/api/request.js`）：

| code | 含义 | 前端动作 |
|---|---|---|
| `1002` | 未登录 / token 无效 | 清 sessionStorage → 回登录页 |
| `1003` | token 过期 | 单例 refresh（并发去重）→ 重放原请求 |
| `1004` | 已登录但**不是管理员** | 只提示，**不跳登录页** |

## 接口对照

后端：`http://192.168.9.103:3000`（开发经 Vite 代理 `/api`，见 `vite.config.js`）
接口文档：`http://192.168.9.103:3000/api/docs`（OpenAPI：`/api/docs-json`）

| 页面 / 能力 | 接口 |
|---|---|
| 登录 | `POST /api/auth/login` → 再 `GET /api/admin/auth/verify` 判管理员 |
| 充值核销 | `GET /api/admin/recharges`、`POST /api/admin/recharges/{id}/confirm` |
| 用户管理 | `GET /api/admin/users`、`POST /api/admin/users/{id}/status` |
| 交易流水 | `GET /api/admin/transactions`、`GET /api/admin/transactions/export`（CSV） |
| 日对账 | `GET /api/admin/reconciliation/daily`、`POST .../run`、`GET .../provision-jobs` |
| 管理员管理 | `GET/POST /api/admin/admins`、`POST .../{id}/status`、`POST .../{id}/password` |
| 操作日志 | `GET /api/admin/audit-logs` |
| 修改密码 | `POST /api/auth/password` |

**全部走真实接口，`src/mock/` 已删除。**

## 接口约定（实测）

- 响应统一 `{ code, message, data }`；**导出 CSV 例外**（裸文件流，带 BOM）
- 分页：`page`（默认 1）+ `size`（默认 20，上限 100），另有 `page_size` 别名
- 金额一律**整数分**；时间一律 **UTC ISO 8601**；ID 一律**字符串**
- 日志筛选：`operator` / `action` / `target` / `start_date` / `end_date`
- 核销用 `WHERE id=? AND status=0` 抢占，**重复核销被拒**（`4002`）
- 后端**只记写操作与导出**，读接口不写日志

## 上线提醒

- `access_token` 存 `sessionStorage`，**不硬编码、不进 localStorage**
- **只在内网部署，绝不与 C 端共用公网入口**
- 后端首次响应较慢，请求超时已放宽到 30s
- **不要改回直连后端**：`refresh_token` 是 `SameSite=Strict` Cookie，跨站不会被发送，刷新会静默失败
