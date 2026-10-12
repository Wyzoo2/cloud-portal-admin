<template>
  <div class="recon">
    <el-card shadow="never">
      <div class="toolbar">
        <el-date-picker v-model="date" type="date" placeholder="业务日（UTC）"
          value-format="YYYY-MM-DD" class="w-date" />
        <el-button type="primary" :loading="loading" @click="load">查询</el-button>
        <div class="jobs">
          <span class="job">开通任务：</span>
          <span class="job">待处理 {{ jobs.pending }}</span>
          <span class="job">处理中 {{ jobs.processing }}</span>
          <span class="job ok">成功 {{ jobs.success }}</span>
          <span class="job bad">失败 {{ jobs.failed }}</span>
        </div>
      </div>

      <div class="summary">
        <el-card v-for="s in summaryCards" :key="s.label" class="sum" shadow="never">
          <div class="sum-value" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="sum-label">{{ s.label }}</div>
        </el-card>
      </div>
    </el-card>

    <el-card shadow="never" class="mt">
      <template #header>分产品对账{{ data.date ? '（' + data.date + '）' : '' }}</template>
      <el-table :data="data.products" stripe v-loading="loading">
        <el-table-column label="产品" min-width="100">
          <template #default="{ row }">{{ productName(row.product_code) }}</template>
        </el-table-column>
        <el-table-column label="门户金额" min-width="110">
          <template #default="{ row }">{{ formatCents(row.portal_cents) }}</template>
        </el-table-column>
        <el-table-column label="产品金额" min-width="110">
          <template #default="{ row }">{{ formatCents(row.product_cents) }}</template>
        </el-table-column>
        <el-table-column label="差异" min-width="100">
          <template #default="{ row }">
            <span :class="row.diff_cents ? 'diff' : ''">{{ formatCents(row.diff_cents) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.diff_count ? 'danger' : 'success'" disable-transitions>
              {{ row.diff_count ? '有差异' : '一致' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="only_product" label="仅产品侧" width="90" />
        <el-table-column prop="only_portal" label="仅门户侧" width="90" />
        <el-table-column prop="mismatch" label="金额不一致" width="100" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="runAgain(row.product_code)">补跑</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-tip">{{ loading ? '加载中…' : '该日无对账数据' }}</div>
        </template>
      </el-table>
    </el-card>

    <el-card shadow="never" class="mt">
      <template #header>差异明细（{{ data.mismatches.length }} 条）</template>
      <el-table :data="data.mismatches" stripe v-loading="loading">
        <el-table-column prop="kind" label="差异类型" width="120" />
        <el-table-column label="产品" width="100">
          <template #default="{ row }">{{ productName(row.product_code) }}</template>
        </el-table-column>
        <el-table-column prop="bill_no" label="账单号" min-width="260" show-overflow-tooltip />
        <template #empty>
          <div class="empty-tip">{{ loading ? '加载中…' : '该日无差异，对账一致' }}</div>
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { reconciliationApi } from '../../api/reconciliation'
import { formatCents, formatDate } from '../../utils/format'
import { PRODUCT_NAME } from '../../utils/constants'

export default {
  name: 'Reconciliation',
  data() {
    return {
      // 后端不传 date 时默认查前一日（UTC），这里默认也取前一日
      date: formatDate(new Date(Date.now() - 86400000).toISOString()),
      loading: false,
      data: { date: '', summary: {}, products: [], mismatches: [] },
      jobs: { pending: 0, processing: 0, success: 0, failed: 0 }
    }
  },
  computed: {
    summaryCards() {
      const s = this.data.summary || {}
      return [
        { label: '门户流水', value: formatCents(s.portal_total_cents), color: 'var(--accent)' },
        { label: '产品账单', value: formatCents(s.product_total_cents), color: 'var(--text-primary)' },
        {
          label: '差异金额',
          value: formatCents(s.diff_cents),
          color: s.diff_cents ? 'var(--error)' : 'var(--success)'
        },
        {
          label: '仅产品侧 / 仅门户侧 / 金额不一致',
          value: `${s.only_product || 0} / ${s.only_portal || 0} / ${s.mismatch || 0}`,
          color: 'var(--warning)'
        }
      ]
    }
  },
  created() {
    this.load()
    this.loadJobs()
  },
  methods: {
    formatCents,
    productName(code) {
      return PRODUCT_NAME[code] || code || '-'
    },
    async load() {
      this.loading = true
      try {
        this.data = await reconciliationApi.daily(this.date)
      } catch (e) {
        this.$message.error((e && e.message) || '查询失败')
      } finally {
        this.loading = false
      }
    },
    async loadJobs() {
      try {
        this.jobs = await reconciliationApi.provisionJobs()
      } catch (e) {
        // 排障接口，失败不打扰
      }
    },
    async runAgain(productCode) {
      try {
        await reconciliationApi.run(this.date, productCode)
        this.$message.success('已触发对账，正在刷新…')
        this.load()
        this.loadJobs()
      } catch (e) {
        this.$message.error((e && e.message) || '触发失败')
      }
    }
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
}
/* 单个 date picker 的根元素同样是 .el-input__wrapper（带 flex-grow:1） */
.toolbar > * {
  flex: none;
}
.toolbar :deep(.el-date-editor.el-input__wrapper) {
  flex: none;
  width: 172px;
}
.jobs {
  margin-left: auto;
  display: flex;
  gap: var(--space-sm);
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.job.bad {
  color: var(--error);
}
.job.ok {
  color: var(--success);
}
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: var(--space);
}
.sum-value {
  font-size: 22px;
  font-weight: 700;
}
.sum-label {
  margin-top: var(--space-xs);
  color: var(--text-secondary);
  font-size: var(--font-sm);
}
.mt {
  margin-top: var(--space-md);
}
.diff {
  color: var(--error);
  font-weight: 600;
}
.empty-tip {
  padding: var(--space-lg);
  color: var(--text-disabled);
  font-size: var(--font-sm);
}
</style>
