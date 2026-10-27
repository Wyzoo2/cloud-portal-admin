<template>
  <el-card shadow="never">
    <div class="filters">
      <el-input v-model="keyword" placeholder="搜索账号 / 手机号" clearable class="w-md"
        @keyup.enter="onSearch" @clear="onSearch" />
      <el-button type="primary" @click="onSearch">搜索</el-button>
      <el-button v-if="canWrite" class="push" type="primary" plain @click="openCreate">新建员工</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column label="登录账号" min-width="160">
        <template #default="{ row }">
          {{ row.username }}
          <el-tag v-if="row.is_owner" size="small" type="warning" disable-transitions class="own-tag">主管理员</el-tag>
          <el-tag v-else-if="row.is_admin" size="small" type="success" disable-transitions class="own-tag">管理员</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="手机号" min-width="130">
        <template #default="{ row }">{{ row.phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><StatusTag type="user" :value="row.status" /></template>
      </el-table-column>
      <el-table-column label="首次登录" width="110">
        <template #default="{ row }">
          <span v-if="row.must_change_password" class="warn-text">待改密</span>
          <span v-else class="muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button v-if="canReset" size="small" @click="onReset(row)">重置密码</el-button>
          <el-tooltip v-if="row.is_owner" content="企业管理员不可停用" placement="top">
            <el-button size="small" disabled>停用</el-button>
          </el-tooltip>
          <el-button v-else-if="row.status === 0" size="small" type="danger" :disabled="!canWrite"
            @click="onToggle(row, 1)">停用</el-button>
          <el-button v-else size="small" :disabled="!canWrite" @click="onToggle(row, 0)">恢复</el-button>
        </template>
      </el-table-column>

      <template #empty>
        <div class="empty-tip">{{ loading ? '加载中…' : '暂无员工' }}</div>
      </template>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next"
        :current-page="page" :page-size="size" :page-sizes="[10, 20, 50]" :total="total"
        @current-change="onPageChange" @size-change="onSizeChange" />
    </div>

    <!-- 新建员工 -->
    <el-dialog v-model="createVisible" title="新建员工" width="420px">
      <el-form ref="createRef" :model="form" :rules="rules" label-width="84px">
        <el-form-item label="登录账号" prop="username">
          <el-input v-model.trim="form.username" placeholder="企业内唯一" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model.trim="form.phone" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 初始密码（仅展示一次） -->
    <el-dialog v-model="pwdVisible" title="初始密码" width="420px" :close-on-click-modal="false">
      <p class="pwd-account">账号：<strong>{{ pwdUsername }}</strong></p>
      <div class="pwd-box">
        <code ref="pwdCode">{{ initialPassword }}</code>
        <el-button link type="primary" @click="copyPassword">复制</el-button>
      </div>
      <p class="pwd-tip">仅显示这一次，关闭后无法再次查看；员工首次登录须改密</p>
      <template #footer>
        <el-button type="primary" @click="pwdVisible = false">我已保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script>
import { enterpriseUserApi } from '../../api/enterpriseUsers'
import { useSessionStore } from '../../store/session'
import { formatTime } from '../../utils/format'
import { PERM } from '../../utils/constants'
import { errorText } from '../../utils/errors'
import { copyText } from '../../utils/clipboard'
import StatusTag from '../../components/StatusTag.vue'

export default {
  name: 'MemberList',
  components: { StatusTag },
  data() {
    return {
      keyword: '',
      list: [],
      total: 0,
      page: 1,
      size: 10,
      loading: false,
      submitting: false,
      createVisible: false,
      form: { username: '', phone: '' },
      rules: {
        username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }]
      },
      pwdVisible: false,
      pwdUsername: '',
      initialPassword: ''
    }
  },
  computed: {
    canWrite() {
      return useSessionStore().hasPerm(PERM.ENT_MEMBER_WRITE)
    },
    canReset() {
      return useSessionStore().hasPerm(PERM.ENT_MEMBER_RESET)
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
        const res = await enterpriseUserApi.list({
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

    openCreate() {
      this.form = { username: '', phone: '' }
      this.createVisible = true
    },
    async submitCreate() {
      const valid = await this.$refs.createRef.validate().catch(() => false)
      if (!valid) return
      this.submitting = true
      try {
        const payload = { username: this.form.username }
        if (this.form.phone) payload.phone = this.form.phone
        const res = await enterpriseUserApi.create(payload)
        this.createVisible = false
        this.showPassword(this.form.username, res.initial_password)
        this.load()
      } catch (e) {
        this.$message.error(errorText(e))
      } finally {
        this.submitting = false
      }
    },

    async onReset(row) {
      try {
        await this.$confirm(`确认重置「${row.username}」的密码？该员工所有设备会被强制下线。`,
          '重置密码', { type: 'warning' })
      } catch (e) {
        return
      }
      try {
        const res = await enterpriseUserApi.resetPassword(row.id)
        this.showPassword(row.username, res.initial_password)
      } catch (e) {
        this.$message.error(errorText(e))
      }
    },

    async onToggle(row, status) {
      const isDisable = status === 1
      try {
        await this.$confirm(
          isDisable ? `确认停用「${row.username}」？将强制其下线。` : `确认恢复「${row.username}」？`,
          isDisable ? '停用员工' : '恢复员工',
          { type: 'warning' }
        )
      } catch (e) {
        return
      }
      try {
        await enterpriseUserApi.setStatus(row.id, status)
        this.$message.success(isDisable ? '已停用' : '已恢复')
        this.load()
      } catch (e) {
        this.$message.error(errorText(e))
        this.load()
      }
    },

    showPassword(username, password) {
      this.pwdUsername = username
      this.initialPassword = password || '-'
      this.pwdVisible = true
    },
    async copyPassword() {
      if (await copyText(this.initialPassword)) {
        this.$message.success('已复制')
        return
      }
      // 浏览器不允许写剪贴板时，选中文本让用户 Ctrl+C
      this.selectPassword()
      this.$message.warning('请按 Ctrl+C 复制')
    },
    selectPassword() {
      const el = this.$refs.pwdCode
      if (!el) return
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
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
  width: 200px;
}
.push {
  margin-left: auto;
}
.own-tag {
  margin-left: 6px;
}
.warn-text {
  color: var(--el-color-warning);
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
.pwd-account {
  margin: 0 0 10px;
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.pwd-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 12px 16px;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
}
.pwd-box code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16px;
  letter-spacing: 1px;
  color: var(--text-primary);
  word-break: break-all;
}
.pwd-tip {
  margin: 10px 0 0;
  font-size: var(--font-xs);
  color: var(--el-color-warning);
}
@media (max-width: 768px) {
  .w-md {
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
