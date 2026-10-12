<template>
  <el-card shadow="never">
    <div class="filters">
      <el-radio-group v-model="status" @change="onFilterChange">
        <el-radio-button :value="0">待核销</el-radio-button>
        <el-radio-button :value="1">已到账</el-radio-button>
        <el-radio-button :value="2">已驳回</el-radio-button>
        <el-radio-button :value="''">全部</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="apply_id" label="申请号" min-width="100" />
      <el-table-column label="用户" min-width="150">
        <template #default="{ row }">
          {{ row.username }}<div class="sub">{{ row.phone }}</div>
        </template>
      </el-table-column>
      <el-table-column label="金额" min-width="110">
        <template #default="{ row }"><span class="money">{{ formatCents(row.amount_cents) }}</span></template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><StatusTag type="recharge" :value="row.status" /></template>
      </el-table-column>
      <el-table-column label="申请时间" min-width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="经办人" min-width="120">
        <template #default="{ row }">
          <span v-if="row.status === 0" class="muted">—</span>
          <span v-else>{{ row.reviewed_by_username || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button size="small" type="primary" @click="open(row, false)">核销</el-button>
            <el-button size="small" @click="open(row, true)">驳回</el-button>
          </template>
          <span v-else-if="row.status === 1" class="muted">{{ row.reviewed_at ? '已到账 · ' + formatTime(row.reviewed_at) : '已到账' }}</span>
          <span v-else class="muted danger">{{ row.reject_reason || '已驳回' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next"
        :current-page="page" :page-size="size" :page-sizes="[10, 20, 50]" :total="total"
        @current-change="onPageChange" @size-change="onSizeChange" />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'reject' ? '驳回充值申请' : '核销充值'" width="440px">
      <div v-if="current" class="dialog-body">
        <p><strong>用户：</strong>{{ current.username }}（{{ current.phone }}）</p>
        <p><strong>金额：</strong><span class="money">{{ formatCents(current.amount_cents) }}</span></p>
        <p><strong>备注：</strong>{{ current.remark || '-' }}</p>
        <el-input v-if="dialogMode === 'reject'" v-model="reason" type="textarea" :rows="2"
          placeholder="驳回理由（会展示给用户）" />
        <p v-else class="tip">确认已收到该用户线下转账？到账后不可撤销。</p>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button :type="dialogMode === 'reject' ? 'danger' : 'primary'" :loading="submitting" @click="submit">
          {{ dialogMode === 'reject' ? '确认驳回' : '确认核销' }}
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script>
import { rechargeApi } from '../../api/recharges'
import { useBadgeStore } from '../../store/badge'
import { formatCents, formatTime } from '../../utils/format'
import { errorText } from '../../utils/errors'
import StatusTag from '../../components/StatusTag.vue'

export default {
  name: 'RechargeList',
  components: { StatusTag },
  data() {
    return {
      // 默认只看待核销（这是运营的日常操作队列）
      status: 0,
      list: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      dialogVisible: false,
      dialogMode: 'confirm',
      current: null,
      reason: '',
      submitting: false
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
        const res = await rechargeApi.list({ status: this.status, page: this.page, size: this.size })
        this.list = res.list
        this.total = res.total
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
    open(row, reject) {
      this.current = row
      this.dialogMode = reject ? 'reject' : 'confirm'
      this.reason = ''
      this.dialogVisible = true
    },
    async submit() {
      this.submitting = true
      try {
        // 经办人由后端从 JWT 取，前端不再传 admin_id
        await rechargeApi.confirm(this.current.apply_id, {
          reject: this.dialogMode === 'reject',
          reason: this.reason
        })
        this.dialogVisible = false
        this.$message.success(this.dialogMode === 'reject' ? '已驳回' : '已核销到账')
        this.load()
      } catch (e) {
        // 4002 = 已被别人处理（后端用 WHERE status=0 抢占）
        this.$message.error(errorText(e))
        this.load()
      } finally {
        this.submitting = false
        // 不论成功还是被别人抢先，待核销数都变了 → 同步顶栏角标
        useBadgeStore().refresh()
      }
    }
  }
}
</script>

<style scoped>
.filters {
  margin-bottom: var(--space-md);
}
.sub {
  font-size: var(--font-xs);
  color: var(--text-secondary);
}
.money {
  font-weight: 600;
}
.muted {
  font-size: var(--font-xs);
  color: var(--text-secondary);
}
.muted.danger {
  color: var(--error);
}
.dialog-body p {
  margin: var(--space-sm) 0;
}
.tip {
  color: var(--warning);
  font-size: var(--font-sm);
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-md);
}
@media (max-width: 768px) {
  .pager {
    justify-content: center;
  }
}
</style>
