<template>
  <el-card shadow="never">
    <div class="filters">
      <el-select v-model="action" placeholder="操作类型" clearable class="w-md" @change="onFilterChange">
        <el-option v-for="o in actionOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-input v-model="operator" placeholder="操作人" clearable class="w-sm"
        @keyup.enter="onFilterChange" @clear="onFilterChange" />
      <el-input v-model="target" placeholder="操作对象（如 apply:27）" clearable class="w-md"
        @keyup.enter="onFilterChange" @clear="onFilterChange" />
      <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="~"
        start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD"
        class="w-date" @change="onFilterChange" />
      <el-button v-if="hasFilter" text @click="onReset">重置</el-button>
      <el-button type="primary" @click="onFilterChange">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column label="操作人" min-width="120">
        <template #default="{ row }">{{ row.operator || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" min-width="130">
        <template #default="{ row }">
          <el-tag size="small" type="info" disable-transitions>{{ actionText(row.action) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="对象" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ row.target || '-' }}</template>
      </el-table-column>
      <el-table-column label="详情" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">{{ detailText(row.detail) }}</template>
      </el-table-column>
      <el-table-column label="IP" min-width="130">
        <template #default="{ row }">{{ row.ip || '-' }}</template>
      </el-table-column>
      <el-table-column label="时间" min-width="160">
        <template #default="{ row }">{{ formatTime(row.created_at, true) }}</template>
      </el-table-column>

      <template #empty>
        <div class="empty-tip">{{ loading ? '加载中…' : '暂无日志' }}</div>
      </template>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next"
        :current-page="page" :page-size="size" :page-sizes="[10, 20, 50]" :total="total"
        @current-change="onPageChange" @size-change="onSizeChange" />
    </div>
  </el-card>
</template>

<script>
import { auditApi } from '../../api/audit'
import { formatTime } from '../../utils/format'
import { AUDIT_ACTION, AUDIT_ACTION_OPTIONS } from '../../utils/constants'
import { errorText } from '../../utils/errors'

export default {
  name: 'AuditLog',
  data() {
    return {
      action: '',
      operator: '',
      target: '',
      dateRange: null,
      list: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      actionOptions: AUDIT_ACTION_OPTIONS
    }
  },
  created() {
    this.load()
  },
  computed: {
    hasFilter() {
      return !!(this.action || this.operator || this.target || this.dateRange)
    }
  },
  methods: {
    formatTime,
    actionText(action) {
      return AUDIT_ACTION[action] || action || '-'
    },
    /** detail 是后端自定义 JSON，做可读化兜底（值可能是嵌套对象） */
    detailText(detail) {
      if (detail == null || detail === '') return '-'
      if (typeof detail === 'string') return detail
      if (typeof detail === 'object') {
        const fmt = v => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v))
        const parts = Object.keys(detail).map(k => `${k}=${fmt(detail[k])}`)
        return parts.length ? parts.join('，') : '-'
      }
      return String(detail)
    },
    async load() {
      this.loading = true
      try {
        const r = this.dateRange || []
        const res = await auditApi.list({
          action: this.action,
          operator: this.operator,
          target: this.target,
          start_date: r[0] || '',
          end_date: r[1] || '',
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
    onFilterChange() {
      this.page = 1
      this.load()
    },
    onReset() {
      this.action = ''
      this.operator = ''
      this.target = ''
      this.dateRange = null
      this.onFilterChange()
    },
    onPageChange(p) {
      this.page = p
      this.load()
    },
    onSizeChange(s) {
      this.size = s
      this.page = 1
      this.load()
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
.w-sm {
  width: 118px;
}
.w-md {
  width: 180px;
}
/* 工具栏子项都不参与伸缩，宽度才能被尊重 */
.filters > * {
  flex: none;
}
/* 同交易流水页：daterange 根元素带 .el-input__wrapper，被 EP 的 flex-grow:1 撑满 */
.filters :deep(.el-date-editor.el-range-editor) {
  --el-date-editor-daterange-width: 226px;
  flex: none;
  width: 226px;
}
.filters :deep(.el-range-input) {
  font-size: var(--font-sm);
}
.empty-tip {
  padding: var(--space-lg);
  color: var(--text-disabled);
  font-size: var(--font-sm);
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-md);
}
@media (max-width: 768px) {
  .w-sm,
  .w-md,
  .filters :deep(.el-date-editor.el-range-editor) {
    width: 100%;
  }
  .pager {
    justify-content: center;
  }
}
</style>
