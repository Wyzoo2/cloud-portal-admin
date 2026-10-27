<template>
  <el-card shadow="never">
    <div class="filters">
      <el-select v-model="status" placeholder="企业状态" clearable class="w-md" @change="onFilterChange">
        <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-input v-model="keyword" placeholder="企业名称 / 编码" clearable class="w-md"
        @keyup.enter="onFilterChange" @clear="onFilterChange" />
      <el-button type="primary" @click="onFilterChange">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column label="企业" min-width="160">
        <template #default="{ row }">
          <div class="ent-name">{{ row.name }}</div>
          <div class="ent-code">{{ row.code }}</div>
        </template>
      </el-table-column>
      <el-table-column label="联系人" min-width="120">
        <template #default="{ row }">
          <span v-if="row.contact_name">{{ row.contact_name }}</span>
          <span v-else class="muted">-</span>
          <div v-if="row.contact_phone" class="ent-code">{{ row.contact_phone }}</div>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.remark">{{ row.remark }}</span>
          <span v-else class="muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="申请时间" min-width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="onApprove(row)">
            通过
          </el-button>
          <el-button v-if="row.status === 'pending'" size="small" @click="onReject(row)">驳回</el-button>
          <span v-if="row.status !== 'pending'" class="muted">已处理</span>
        </template>
      </el-table-column>

      <template #empty>
        <div class="empty-tip">{{ loading ? '加载中…' : '暂无待审核企业' }}</div>
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
import { ElMessageBox } from 'element-plus'
import { enterpriseApi } from '../../api/enterprises'
import { formatTime } from '../../utils/format'
import { ENTERPRISE_STATUS_OPTIONS } from '../../utils/constants'
import { errorText } from '../../utils/errors'

export default {
  name: 'ApplicationList',
  data() {
    return {
      // 默认看待审核
      status: 'pending',
      keyword: '',
      list: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      statusOptions: ENTERPRISE_STATUS_OPTIONS
    }
  },
  created() {
    this.load()
  },
  methods: {
    formatTime,
    async load() {
      this.loading = true
      try {
        const res = await enterpriseApi.list({
          status: this.status,
          keyword: this.keyword,
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
    onPageChange(p) {
      this.page = p
      this.load()
    },
    onSizeChange(s) {
      this.size = s
      this.page = 1
      this.load()
    },

    async onApprove(row) {
      try {
        await ElMessageBox.confirm(
          `确认通过「${row.name}」的注册申请？通过后该企业立即可用。`,
          '审核通过',
          { type: 'warning', confirmButtonText: '通过' }
        )
      } catch (e) {
        return
      }
      try {
        await enterpriseApi.approve(row.id)
        this.$message.success('已通过')
        this.load()
      } catch (e) {
        this.$message.error(errorText(e))
        this.load()
      }
    },

    async onReject(row) {
      let reason = ''
      try {
        const { value } = await ElMessageBox.prompt(
          `驳回「${row.name}」的注册申请（原因会展示给企业方）`,
          '审核驳回',
          {
            type: 'warning',
            confirmButtonText: '确认驳回',
            inputPlaceholder: '请填写驳回原因（必填）',
            inputValue: '',
            inputValidator: v => (v && v.trim() ? true : '必须填写驳回原因')
          }
        )
        reason = (value || '').trim()
      } catch (e) {
        return
      }
      if (!reason) {
        this.$message.error('必须填写驳回原因')
        return
      }
      try {
        await enterpriseApi.reject(row.id, reason)
        this.$message.success('已驳回')
        this.load()
      } catch (e) {
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
.filters > * {
  flex: none;
}
.w-md {
  width: 180px;
}
.ent-name {
  font-weight: 500;
  color: var(--text-primary);
}
.ent-code {
  margin-top: 2px;
  font-size: var(--font-xs);
  color: var(--text-disabled);
}
.muted {
  color: var(--text-disabled);
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
  .w-md {
    width: 100%;
  }
  .pager {
    justify-content: center;
  }
}
</style>
