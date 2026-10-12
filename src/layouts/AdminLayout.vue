<template>
  <div class="layout">
    <div v-if="drawerOpen" class="mask" @click="drawerOpen = false" />

    <!-- 侧边栏 -->
    <aside class="aside" :class="{ open: drawerOpen, collapsed }">
      <div class="logo" @click="$router.push('/dashboard')">
        <div class="logo-mark">云</div>
        <span class="logo-text">云平台门户</span>
      </div>

      <el-menu :default-active="$route.path" router class="menu"
        :collapse="collapsed" :collapse-transition="false" @select="drawerOpen = false">
        <template v-for="m in menu" :key="m.path || m.label">
          <el-menu-item v-if="m.path" :index="m.path">
            <el-icon><component :is="iconOf(m.icon)" /></el-icon>
            <template #title>{{ m.label }}</template>
          </el-menu-item>

          <el-sub-menu v-else :index="m.label">
            <template #title>
              <el-icon><component :is="iconOf(m.icon)" /></el-icon>
              <span>{{ m.label }}</span>
            </template>
            <el-menu-item v-for="c in m.children" :key="c.path" :index="c.path">
              <span>{{ c.label }}</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>

      <!-- 底部：折叠 + 设置 -->
      <div class="aside-foot">
        <el-tooltip :content="collapsed ? '展开菜单' : '收起菜单'" placement="top">
          <el-icon class="foot-btn" @click="collapsed = !collapsed">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
        </el-tooltip>
        <el-tooltip content="系统设置" placement="top">
          <el-icon class="foot-btn" @click="settingsVisible = true"><Setting /></el-icon>
        </el-tooltip>
      </div>
    </aside>

    <!-- 主体 -->
    <div class="main">
      <header class="header">
        <div class="left">
          <el-icon class="hamburger" @click="drawerOpen = true"><Fold /></el-icon>
          <el-tooltip content="刷新" placement="bottom">
            <el-icon class="action" @click="refresh"><Refresh /></el-icon>
          </el-tooltip>
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title && $route.path !== '/dashboard'">
              {{ $route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="right">
          <div class="search" @click="openSearch">
            <el-icon><Search /></el-icon>
            <span class="search-text">搜索</span>
            <span class="kbd">Ctrl K</span>
          </div>
          <el-tooltip :content="theme.mode === 'dark' ? '切换浅色' : '切换深色'" placement="bottom">
            <el-icon class="action" @click="theme.toggle()">
              <Moon v-if="theme.mode === 'light'" />
              <Sunny v-else />
            </el-icon>
          </el-tooltip>
          <el-tooltip content="全屏" placement="bottom">
            <el-icon class="action hide-sm" @click="toggleFullscreen"><FullScreen /></el-icon>
          </el-tooltip>
          <el-tooltip content="待核销充值" placement="bottom">
            <el-badge :value="pending" :hidden="!pending" class="bell">
              <el-icon class="action" @click="$router.push('/recharges')"><Bell /></el-icon>
            </el-badge>
          </el-tooltip>
          <el-dropdown @command="onCommand">
            <span class="user">
              <span class="user-name">{{ operator || '管理员' }}</span>
              <el-icon class="user-caret"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>{{ operator || '管理员' }}</el-dropdown-item>
                <el-dropdown-item command="password" divided>修改密码</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 多标签页 -->
      <div class="tabbar">
        <div class="tabs">
          <div v-for="t in tabs" :key="t.path" class="tab"
            :class="{ active: t.path === $route.path }" @click="$router.push(t.path)">
            <el-icon class="tab-icon"><component :is="iconOf(t.icon)" /></el-icon>
            <span class="tab-title">{{ t.title }}</span>
            <el-icon v-if="t.closable" class="tab-close" @click.stop="closeTab(t)"><Close /></el-icon>
          </div>
        </div>
        <div class="tabbar-right">
          <el-dropdown @command="onTabCommand">
            <el-icon class="tabbar-btn"><ArrowDown /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="others">关闭其他</el-dropdown-item>
                <el-dropdown-item command="all">关闭全部</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-icon class="tabbar-btn hide-sm" @click="toggleFullscreen"><FullScreen /></el-icon>
        </div>
      </div>

      <main class="content">
        <router-view :key="$route.path + '-' + refreshKey" />
      </main>
    </div>

    <!-- 搜索菜单 -->
    <el-dialog v-model="searchVisible" title="搜索菜单" width="440px" append-to-body>
      <el-input v-model="searchText" placeholder="输入菜单名称" clearable />
      <div class="search-list">
        <div v-for="m in searchResults" :key="m.path" class="search-item" @click="go(m.path)">
          <el-icon><component :is="iconOf(m.icon)" /></el-icon>
          <span class="search-label">{{ m.label }}</span>
          <span class="search-path">{{ m.path }}</span>
        </div>
        <div v-if="!searchResults.length" class="search-empty">无匹配菜单</div>
      </div>
    </el-dialog>

    <!-- 系统设置 -->
    <el-drawer v-model="settingsVisible" title="系统设置" size="280px" append-to-body>
      <div class="setting-row">
        <span>深色模式</span>
        <el-switch :model-value="theme.mode === 'dark'"
          @change="v => theme.setMode(v ? 'dark' : 'light')" />
      </div>
      <div class="setting-row">
        <span>折叠侧边栏</span>
        <el-switch v-model="collapsed" />
      </div>
    </el-drawer>

    <!-- 修改密码 -->
    <ChangePasswordDialog v-model="pwdVisible" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import { useBadgeStore } from '../store/badge'
import { ADMIN_MENU, flattenMenu } from '../utils/constants'
import ChangePasswordDialog from '../components/ChangePasswordDialog.vue'
import {
  Odometer, Sell, Money, Setting, User, List, DataAnalysis, Document,
  Fold, Expand, Moon, Sunny, Close, Search, Refresh, FullScreen, Bell, ArrowDown
} from '@element-plus/icons-vue'

const ICONS = {
  Odometer, Sell, Money, Setting, User, List, DataAnalysis, Document
}

export default {
  name: 'AdminLayout',
  components: { Fold, Expand, Moon, Sunny, Close, Search, Refresh, FullScreen, Bell, ArrowDown, Setting, ChangePasswordDialog },
  data() {
    return {
      menu: ADMIN_MENU,
      drawerOpen: false,
      collapsed: false,
      tabs: [],
      refreshKey: 0,
      searchVisible: false,
      searchText: '',
      settingsVisible: false,
      pwdVisible: false
    }
  },
  setup() {
    return { theme: useThemeStore() }
  },
  computed: {
    ...mapState(useAuthStore, ['operator']),
    ...mapState(useBadgeStore, ['pending']),
    searchResults() {
      const k = this.searchText.trim().toLowerCase()
      const all = flattenMenu()
      if (!k) return all
      return all.filter(m => m.label.toLowerCase().includes(k) || m.path.includes(k))
    }
  },
  watch: {
    $route(to) {
      this.addTab(to)
    }
  },
  created() {
    this.refreshPending()
    this.addTab(this.$route)
    window.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    iconOf(name) {
      return ICONS[name] || Document
    },
    onKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        this.openSearch()
      }
    },
    openSearch() {
      this.searchText = ''
      this.searchVisible = true
    },
    go(path) {
      this.searchVisible = false
      this.$router.push(path)
    },
    async refreshPending() {
      await useBadgeStore().refresh()
    },
    refresh() {
      this.refreshKey++
      this.refreshPending()
    },
    toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen()
      else document.exitFullscreen()
    },
    addTab(route) {
      const title = route.meta && route.meta.title
      if (!title) return
      if (this.tabs.find(t => t.path === route.path)) return
      const item = flattenMenu().find(m => m.path === route.path)
      this.tabs.push({
        path: route.path,
        title,
        icon: (item && item.icon) || 'Document',
        closable: route.path !== '/dashboard'
      })
    },
    closeTab(tab) {
      const i = this.tabs.findIndex(t => t.path === tab.path)
      if (i < 0) return
      const isActive = tab.path === this.$route.path
      this.tabs.splice(i, 1)
      if (isActive) {
        const next = this.tabs[i] || this.tabs[i - 1] || this.tabs[this.tabs.length - 1]
        this.$router.push(next ? next.path : '/dashboard')
      }
    },
    onTabCommand(cmd) {
      if (cmd === 'others') {
        this.tabs = this.tabs.filter(t => !t.closable || t.path === this.$route.path)
      } else if (cmd === 'all') {
        this.tabs = this.tabs.filter(t => !t.closable)
        const first = this.tabs[0]
        if (first) this.$router.push(first.path)
      }
    },
    onCommand(cmd) {
      if (cmd === 'logout') {
        useAuthStore().logout()
        this.$router.push('/login')
      } else if (cmd === 'password') {
        this.pwdVisible = true
      }
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100%;
}
.mask {
  display: none;
}

/* ── 侧边栏 ── */
.aside {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-right: 1px solid var(--divider);
  display: flex;
  flex-direction: column;
  transition: width 0.25s, background-color 0.25s;
  overflow: hidden;
}
.aside.collapsed {
  width: 64px;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0 var(--space-md);
  cursor: pointer;
  border-bottom: 1px solid var(--divider);
  white-space: nowrap;
}
.logo-mark {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--accent-gradient);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-text {
  font-weight: 700;
  font-size: var(--font-md);
  color: var(--text-primary);
}
.aside.collapsed .logo {
  justify-content: center;
  padding: 0;
}
.aside.collapsed .logo-text {
  display: none;
}
.menu {
  flex: 1;
  border-right: none;
  padding: var(--space-sm);
  --el-menu-bg-color: transparent;
  --el-menu-border-color: transparent;
}
.aside.collapsed .menu {
  padding: var(--space-sm) 0;
}
.aside-foot {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--divider);
}
.foot-btn {
  font-size: 17px;
  cursor: pointer;
  color: var(--text-secondary);
}
.foot-btn:hover {
  color: var(--accent);
}

/* ── 顶栏 ── */
.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 0 var(--space-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
  flex-shrink: 0;
}
.left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}
.right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.hamburger {
  display: none;
  font-size: 20px;
  cursor: pointer;
}
.action {
  font-size: 17px;
  cursor: pointer;
  color: var(--text-secondary);
}
.action:hover {
  color: var(--accent);
}
.breadcrumb {
  margin-left: var(--space-xs);
  white-space: nowrap;
}
.search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 var(--space);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: border-color 0.2s;
}
.search:hover {
  border-color: var(--accent);
}
.search-text {
  color: var(--text-secondary);
}
.kbd {
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-disabled);
}
.bell {
  display: inline-flex;
}
.user {
  display: flex;
  margin-left: 10px;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
  outline: none;
}
.user-name {
  font-size: var(--font-base);
  color: var(--text-primary);
}
.user-caret {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ── 标签页 ── */
.tabbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md) 0;
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
  flex-shrink: 0;
}
.tabs {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  overflow-x: auto;
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--divider);
  border-bottom: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.tab.active {
  background: var(--bg-page);
  color: var(--accent);
  font-weight: 600;
}
.tab-icon {
  font-size: 13px;
}
.tab-close {
  font-size: 12px;
}
.tab-close:hover {
  color: var(--error);
}
.tabbar-right {
  display: flex;
  align-items: center;
  gap: var(--space);
}
.tabbar-btn {
  font-size: 15px;
  cursor: pointer;
  color: var(--text-secondary);
}
.tabbar-btn:hover {
  color: var(--accent);
}

.content {
  flex: 1;
  padding: var(--space-md);
}

/* ── 搜索 / 设置 ── */
.search-list {
  margin-top: var(--space);
  max-height: 320px;
  overflow-y: auto;
}
.search-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.search-item:hover {
  background: var(--bg-page);
  color: var(--accent);
}
.search-label {
  flex: 1;
}
.search-path {
  font-size: var(--font-xs);
  color: var(--text-disabled);
}
.search-empty {
  padding: var(--space-lg);
  text-align: center;
  color: var(--text-disabled);
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space) 0;
  border-bottom: 1px solid var(--divider);
}

@media (max-width: 768px) {
  .aside {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform 0.25s;
  }
  .aside.open {
    transform: translateX(0);
  }
  .mask {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 20;
    background: rgba(0, 0, 0, 0.4);
  }
  .hamburger {
    display: inline-flex;
  }
  .hide-sm {
    display: none;
  }
  .content {
    padding: var(--space);
  }
}
</style>
