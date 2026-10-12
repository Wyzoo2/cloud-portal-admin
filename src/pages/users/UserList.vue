<template>
  <el-card shadow="never">
    <div class="filters">
      <el-input v-model="keyword" placeholder="搜索用户名 / 手机号" clearable class="w-md"
        @keyup.enter="onSearch" @clear="onSearch" />
      <el-select v-model="status" placeholder="状态" clearable class="w-sm" @change="onSearch">
        <el-option label="正常" :value="0" />
        <el-option label="已禁用" :value="1" />
      </el-select>
      <el-button type="primary" @click="onSearch">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="username" label="用户名" min-width="130" />
      <el-table-column label="手机号" min-width="130">
        <template #default="{ row }">{{ row.phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="余额" min-width="110">
        <template #default="{ row }">{{ formatCents(row.balance_cents) }}</template>
      </el-table-column>
      <el-table-column label="累计充值" min-width="110">
        <template #default="{ row }">{{ formatCents(row.recharge_total_cents) }}</template>
      </el-table-column>
      <el-table-column label="累计消费" min-width="110">
        <template #default="{ row }">{{ formatCents(row.consume_total_cents) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><StatusTag type="user" :value="row.status" /></template>
      </el-table-column>
      <el-table-column label="注册时间" min-width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 0" size="small" type="danger" @click="onDisable(row)">禁用</el-button>
          <el-button v-else size="small" @click="onEnable(row)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next"
        :current-page="page" :page-size="size" :page-sizes="[10, 20, 50]" :total="total"
        @current-change="onPageChange" @size-change="onSizeChange" />
    </div>
  </el-card>
</template>

<script>
import { ElMessageBox } from 'element-plus'
import { userApi } from '../../api/users'
import { formatCents, formatTime } from '../../utils/format'
import { errorText } from '../../utils/errors'
import StatusTag from '../../components/StatusTag.vue'

export default {
  name: 'UserList',
  components: { StatusTag },
  data() {
    return {
      keyword: '',
      status: '',
      list: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false
    }
  },
  created() {
    this.load()
  },
  methods: {
    formatCents,
    formatTime,
    async load() {
      this.loading = true
      try {
        const res = await userApi.list({
          keyword: this.keyword,
          status: this.status,
          page: this.page,
          size: this.size
        })
        this.list = res.list
        this.total = res.total
      } catch (e) {
        this.$message.error(errorText(e))
      } finally {
        this.loading = false
      }
    },
    onSearch() {
      this.page = 1
      this.load()
    },
    onPageChange(p) {
      this.page = p
      this.load()
    },
    onSizeChange(s) {
      this.size = s
      this.page = 1
      this.load()
    },
    async onDisable(row) {
      let reason = ''
      try {
        const { value } = await ElMessageBox.prompt(
          `确认禁用「${row.username}」？将冻结钱包并强制下线。`,
          '禁用用户',
          {
            type: 'warning',
            confirmButtonText: '确认禁用',
            cancelButtonText: '取消',
            inputPlaceholder: '禁用原因（选填）',
            inputValue: ''
          }
        )
        reason = value || ''
      } catch (e) {
        return // 用户取消
      }
      await this.applyStatus(row, 1, reason, '已禁用')
    },
    async onEnable(row) {
      try {
        await ElMessageBox.confirm(
          `确认恢复「${row.username}」？`,
          '恢复用户',
          { type: 'warning', confirmButtonText: '确认恢复' }
        )
      } catch (e) {
        return
      }
      await this.applyStatus(row, 0, '', '已恢复')
    },
    async applyStatus(row, status, reason, okText) {
      try {
        await userApi.setStatus(row.id, status, reason)
        this.$message.success(okText)
        this.load()
      } catch (e) {
        // 4002 = 状态没变化（可能已被别人处理）
        this.$message.error(errorText(e))
        this.load()
      }
    }
  }
}
</script>

<style scoped>
.filters {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
}
/* Element Plus 的 .el-input__wrapper 带 flex-grow:1，会撑满 flex 工具栏 */
.filters > * {
  flex: none;
}
.w-sm {
  width: 118px;
}
.w-md {
  width: 220px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-md);
}
@media (max-width: 768px) {
  .w-sm,
  .w-md {
    width: 100%;
  }
  .pager {
    justify-content: center;
  }
}
</style>
