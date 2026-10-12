<template>
  <el-card shadow="never">
    <div class="filters">
      <el-button type="primary" @click="openCreate">新建管理员</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="username" label="用户名" min-width="150" />
      <el-table-column label="手机号" min-width="140">
        <template #default="{ row }">{{ row.phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><StatusTag type="admin" :value="row.status" /></template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openReset(row)">重置密码</el-button>
          <el-button v-if="row.status === 0" size="small" type="danger" @click="onToggle(row, 1)">禁用</el-button>
          <el-button v-else size="small" @click="onToggle(row, 0)">启用</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建管理员 -->
    <el-dialog v-model="createVisible" title="新建管理员" width="420px">
      <el-form ref="createRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model.trim="form.username" placeholder="4-32 位字母/数字/下划线" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="8-64 位且含字母和数字" />
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

    <!-- 重置密码 -->
    <el-dialog v-model="resetVisible" :title="`重置「${current && current.username}」的密码`" width="420px">
      <el-input v-model="newPassword" type="password" show-password placeholder="8-64 位，含字母和数字" />
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReset">确认重置</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script>
import { adminApi } from '../../api/admins'
import { formatTime } from '../../utils/format'
import { errorText } from '../../utils/errors'
import StatusTag from '../../components/StatusTag.vue'

export default {
  name: 'AdminList',
  components: { StatusTag },
  data() {
    return {
      list: [],
      loading: false,
      submitting: false,
      createVisible: false,
      resetVisible: false,
      current: null,
      newPassword: '',
      form: { username: '', password: '', phone: '' },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { pattern: /^[a-zA-Z0-9_]{4,32}$/, message: '4-32 位字母/数字/下划线', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { pattern: /^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/, message: '8-64 位且同时含字母和数字', trigger: 'blur' }
        ]
      }
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
        const res = await adminApi.list()
        this.list = res.list
      } catch (e) {
        this.$message.error(errorText(e))
      } finally {
        this.loading = false
      }
    },
    openCreate() {
      this.form = { username: '', password: '', phone: '' }
      this.createVisible = true
    },
    async submitCreate() {
      const valid = await this.$refs.createRef.validate().catch(() => false)
      if (!valid) return
      this.submitting = true
      try {
        const payload = { username: this.form.username, password: this.form.password }
        if (this.form.phone) payload.phone = this.form.phone
        await adminApi.create(payload)
        this.$message.success('已创建')
        this.createVisible = false
        this.load()
      } catch (e) {
        this.$message.error(errorText(e))
      } finally {
        this.submitting = false
      }
    },
    openReset(row) {
      this.current = row
      this.newPassword = ''
      this.resetVisible = true
    },
    async submitReset() {
      if (!/^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/.test(this.newPassword)) {
        this.$message.error('新密码需 8-64 位且同时含字母和数字')
        return
      }
      this.submitting = true
      try {
        const res = await adminApi.resetPassword(this.current.id, this.newPassword)
        const n = res && res.revoked_sessions
        this.$message.success(n ? `已重置，并强制该账号 ${n} 个会话下线` : '已重置')
        this.resetVisible = false
      } catch (e) {
        this.$message.error(errorText(e))
      } finally {
        this.submitting = false
      }
    },
    async onToggle(row, status) {
      const isDisable = status === 1
      try {
        await this.$confirm(
          isDisable ? `确认禁用管理员「${row.username}」？` : `确认启用管理员「${row.username}」？`,
          isDisable ? '禁用管理员' : '启用管理员',
          { type: 'warning' }
        )
      } catch (e) {
        return
      }
      try {
        const res = await adminApi.setStatus(row.id, status)
        const n = res && res.revoked_sessions
        this.$message.success((isDisable ? '已禁用' : '已启用') + (n ? `，强制下线 ${n} 个会话` : ''))
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
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}
</style>
