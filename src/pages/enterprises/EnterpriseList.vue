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
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><StatusTag type="enterprise" :value="row.status" /></template>
      </el-table-column>
      <el-table-column label="联系人" min-width="120">
        <template #default="{ row }">
          <span v-if="row.contact_name">{{ row.contact_name }}</span>
          <span v-else class="muted">-</span>
          <div v-if="row.contact_phone" class="ent-code">{{ row.contact_phone }}</div>
        </template>
      </el-table-column>
      <el-table-column label="成员数" width="90">
        <template #default="{ row }">
          <span v-if="row.member_count !== null">{{ row.member_count }}</span>
          <span v-else class="muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="到期时间" min-width="130">
        <template #default="{ row }">{{ row.expire_at ? formatTime(row.expire_at) : '长期' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'active'" size="small" type="danger" @click="onToggle(row, 'disabled')">
            停用
          </el-button>
          <el-button v-else-if="row.status === 'disabled'" size="small" @click="onToggle(row, 'active')">
            启用
          </el-button>
          <span v-else class="muted">-</span>
        </template>
      </el-table-column>

      <template #empty>
        <div class="empty-tip">{{ loading ? '加载中…' : '暂无企业' }}</div>
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
import StatusTag from '../../components/StatusTag.vue'

export default {
  name: 'EnterpriseList',
  components: { StatusTag },
  data() {
    return {
      status: '',
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
    async onToggle(row, next) {
      const isDisable = next === 'disabled'
      try {
        await ElMessageBox.confirm(
          isDisable ? `确认停用「${row.name}」？该企业账号将无法登录。` : `确认启用「${row.name}」？`,
          isDisable ? '停用企业' : '启用企业',
          { type: 'warning' }
        )
      } catch (e) {
        return
      }
      try {
        await enterpriseApi.setStatus(row.id, next)
        this.$message.success(isDisable ? '已停用' : '已启用')
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
