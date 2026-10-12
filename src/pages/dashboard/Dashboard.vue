<template>
  <div class="dashboard" v-loading="loading">
    <!-- 欢迎横幅 -->
    <div class="welcome">
      <div class="welcome-left">
        <div class="welcome-text">
          <div class="welcome-title">{{ greeting }}，{{ operator || '运维' }}，开始您一天的工作吧！</div>
          <div class="welcome-sub">{{ todayText }}</div>
        </div>
      </div>
      <div class="welcome-stats">
        <div v-for="s in bannerStats" :key="s.label" class="ws">
          <div class="ws-value">{{ s.value }}</div>
          <div class="ws-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- 统计卡 -->
    <div class="stats">
      <el-card v-for="s in stats" :key="s.key" class="stat" shadow="never">
        <div class="stat-top">
          <div class="stat-icon" :style="{ color: s.color }">
            <el-icon :size="20"><component :is="s.icon" /></el-icon>
          </div>
          <div class="stat-value" :style="s.valueColor ? { color: s.valueColor } : {}">{{ s.value }}</div>
        </div>
        <div class="stat-label">{{ s.label }}</div>
      </el-card>
    </div>

    <!-- 快捷导航 -->
    <el-card shadow="never">
      <template #header>快捷导航</template>
      <div class="quick">
        <div v-for="m in quickNav" :key="m.path" class="quick-item" @click="$router.push(m.path)">
          <el-icon :size="22" class="quick-icon"><component :is="m.icon" /></el-icon>
          <span class="quick-label">{{ m.label }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { mapState } from 'pinia'
import { useAuthStore } from '../../store/auth'
import { useBadgeStore } from '../../store/badge'
import { rechargeApi } from '../../api/recharges'
import { userApi } from '../../api/users'
import { transactionApi } from '../../api/transactions'
import { todayLocal } from '../../utils/format'
import { flattenMenu } from '../../utils/constants'
import {
  Sell, User, List, DataLine, Odometer, Money, Setting, Document, DataAnalysis
} from '@element-plus/icons-vue'

const ICONS = { Odometer, Sell, Money, Setting, User, List, DataAnalysis, Document }
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default {
  name: 'Dashboard',
  components: { Sell, User, List, DataLine },
  data() {
    return {
      loading: false,
      stats: [
        { key: 'pending', label: '待核销充值', icon: markRaw(Sell), color: 'var(--warning)', valueColor: 'var(--warning)', value: '-' },
        { key: 'credited', label: '已到账充值', icon: markRaw(DataLine), color: 'var(--success)', valueColor: 'var(--success)', value: '-' },
        { key: 'users', label: '用户总数', icon: markRaw(User), color: 'var(--accent)', valueColor: null, value: '-' },
        { key: 'txs', label: '流水总数', icon: markRaw(List), color: 'var(--accent)', valueColor: null, value: '-' }
      ]
    }
  },
  computed: {
    ...mapState(useAuthStore, ['operator']),
    greeting() {
      const h = new Date().getHours()
      if (h < 6) return '凌晨好'
      if (h < 9) return '早安'
      if (h < 12) return '上午好'
      if (h < 14) return '中午好'
      if (h < 18) return '下午好'
      return '晚上好'
    },
    todayText() {
      // 问候语用的是本机日期，不是后端时间戳
      const d = new Date()
      return `${todayLocal()} ${WEEK[d.getDay()]}`
    },
    bannerStats() {
      return [
        { label: '待办核销', value: this.valueOf('pending') },
        { label: '用户数', value: this.valueOf('users') },
        { label: '流水数', value: this.valueOf('txs') }
      ]
    },
    quickNav() {
      return flattenMenu().map(m => ({ ...m, icon: markRaw(ICONS[m.icon] || Document) }))
    }
  },
  created() {
    this.load()
  },
  methods: {
    valueOf(key) {
      const s = this.stats.find(x => x.key === key)
      return s ? s.value : '-'
    },
    async load() {
      this.loading = true
      try {
        const badge = useBadgeStore()
        const [credited, users, txs] = await Promise.all([
          rechargeApi.countByStatus(1),        // 已到账（status=1 的 total）
          userApi.list({ size: 1 }),           // 用户总数
          transactionApi.list({ size: 1 })     // 流水总数
        ])
        // 待核销数与顶栏角标共用一份状态，避免两处不一致
        await badge.refresh()
        this.setValue('pending', badge.pending)
        this.setValue('credited', credited)
        this.setValue('users', users.total)
        this.setValue('txs', txs.total)
      } catch (e) {
        // 后端不可用时保留 '-'
      } finally {
        this.loading = false
      }
    },
    setValue(key, v) {
      const s = this.stats.find(x => x.key === key)
      if (s) s.value = v
    }
  }
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* 欢迎横幅 */
.welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-card);
  border: 1px solid var(--divider);
  border-radius: var(--radius-lg);
}
.welcome-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}
.welcome-title {
  font-size: var(--font-md);
  font-weight: 600;
}
.welcome-sub {
  margin-top: 4px;
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.welcome-stats {
  display: flex;
  gap: var(--space-xl);
  flex-shrink: 0;
}
.ws {
  text-align: center;
}
.ws-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.ws-label {
  margin-top: 2px;
  font-size: var(--font-xs);
  color: var(--text-secondary);
}

/* 统计卡 */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space);
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius);
  background: var(--bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}
.stat-label {
  margin-top: var(--space-sm);
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

/* 快捷导航宫格 */
.quick {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space);
}
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space);
  border: 1px solid var(--divider);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.quick-item:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.quick-icon {
  color: var(--text-secondary);
}
.quick-item:hover .quick-icon {
  color: var(--accent);
}
.quick-label {
  font-size: var(--font-sm);
}

@media (max-width: 768px) {
  .welcome {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-md);
  }
  .welcome-stats {
    width: 100%;
    justify-content: space-between;
    gap: var(--space);
  }
  .stats {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  .quick {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}
</style>
