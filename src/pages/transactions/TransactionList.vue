<template>
  <el-card shadow="never">
    <div class="filters">
      <el-select v-model="productCode" placeholder="产品" clearable class="w-sm" @change="onFilterChange">
        <el-option label="云存储" value="storage" />
        <el-option label="云手机" value="phone" />
        <el-option label="云电脑" value="desktop" />
      </el-select>
      <el-select v-model="type" placeholder="类型" clearable class="w-sm" @change="onFilterChange">
        <el-option label="充值" :value="1" />
        <el-option label="扣费" :value="2" />
        <el-option label="退款" :value="3" />
        <el-option label="调账" :value="4" />
      </el-select>
      <el-input v-model="keyword" placeholder="用户名 / 手机号" clearable class="w-md"
        @keyup.enter="onFilterChange" @clear="onFilterChange" />
      <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="~"
        start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD"
        class="w-date" @change="onFilterChange" />
      <el-button v-if="hasFilter" text @click="onReset">重置</el-button>
      <el-button type="primary" class="push" :loading="exporting" @click="onExport">导出 CSV</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="bill_no" label="账单号" min-width="200" show-overflow-tooltip />
      <el-table-column label="类型" width="80">
        <template #default="{ row }"><StatusTag type="transaction" :value="row.type" /></template>
      </el-table-column>
      <el-table-column label="金额" min-width="100">
        <template #default="{ row }">
          <span :class="row.type === 2 ? 'minus' : 'plus'">{{ typeSign(row.type) }}{{ formatCents(row.amount_cents) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="产品" min-width="100">
        <template #default="{ row }">{{ productName(row.product_code) }}</template>
      </el-table-column>
      <el-table-column prop="username" label="用户" min-width="130" />
      <el-table-column label="变动后余额" min-width="110">
        <template #default="{ row }">{{ formatCents(row.balance_after) }}</template>
      </el-table-column>
      <el-table-column label="时间" min-width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
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
import { transactionApi } from '../../api/transactions'
import { formatCents, formatTime } from '../../utils/format'
import { TRANSACTION_TYPE, PRODUCT_NAME } from '../../utils/constants'
import { errorText } from '../../utils/errors'
import StatusTag from '../../components/StatusTag.vue'

export default {
  name: 'TransactionList',
  components: { StatusTag },
  data() {
    return {
      productCode: '',
      type: '',
      keyword: '',
      dateRange: null,
      list: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      exporting: false
    }
  },
  created() {
    this.load()
  },
  computed: {
    query() {
      const r = this.dateRange || []
      return {
        product_code: this.productCode,
        type: this.type,
        keyword: this.keyword,
        start_date: r[0] || '',
        end_date: r[1] || ''
      }
    },
    hasFilter() {
      return !!(this.productCode || this.type !== '' || this.keyword || this.dateRange)
    }
  },
  methods: {
    formatCents,
    formatTime,
    typeSign(type) {
      return (TRANSACTION_TYPE[type] && TRANSACTION_TYPE[type].sign) || ''
    },
    productName(code) {
      return code ? (PRODUCT_NAME[code] || code) : '-'
    },
    async load() {
      this.loading = true
      try {
        const res = await transactionApi.list({ ...this.query, page: this.page, size: this.size })
        this.list = res.list
        this.total = res.total
      } catch (e) {
        // 日期非法（如 2026-13-45）后端返回 1001
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
      this.productCode = ''
      this.type = ''
      this.keyword = ''
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
    },
    async onExport() {
      this.exporting = true
      try {
        const { filename } = await transactionApi.exportCsv(this.query)
        this.$message.success('已导出 ' + filename)
      } catch (e) {
        this.$message.error(errorText(e))
      } finally {
        this.exporting = false
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
.w-sm {
  width: 118px;
}
.w-md {
  width: 180px;
}
/* 工具栏子项都不参与伸缩，宽度才能被尊重（需要换行时自然换行） */
.filters > * {
  flex: none;
}
/* Element Plus 给 .el-input__wrapper 设了 flex-grow:1，而 daterange 的根元素
   本身就是 .el-input__wrapper，会在 flex 工具栏里被撑满。
   所以要同时压掉 flex-grow 并覆盖它的宽度变量。 */
.filters :deep(.el-date-editor.el-range-editor) {
  --el-date-editor-daterange-width: 226px;
  flex: none;
  width: 226px;
}
.filters :deep(.el-range-input) {
  font-size: var(--font-sm);
}
.push {
  margin-left: auto;
}
.plus {
  color: var(--success);
}
.minus {
  color: var(--text-primary);
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
  .push {
    margin-left: 0;
    width: 100%;
  }
  .pager {
    justify-content: center;
  }
}
</style>
