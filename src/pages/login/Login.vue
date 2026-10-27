<template>
  <div class="login-page">
    <div class="panel">
      <div class="brand">
        <div class="mark">云</div>
        <h1 class="title">云平台统一门户</h1>
        <p class="sub">管理端</p>
      </div>

      <el-form ref="formRef" class="form" :model="form" :rules="rules" @submit.prevent="onLogin">
        <el-form-item prop="username">
          <el-input v-model.trim="form.username" placeholder="管理员账号" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码"
            :prefix-icon="Lock" show-password @keyup.enter="onLogin" />
        </el-form-item>

        <div v-if="error" class="err">{{ error }}</div>

        <el-button class="btn" type="primary" native-type="submit" :loading="loading">登录</el-button>
      </el-form>
    </div>

    <footer class="foot">© {{ year }} 云平台统一门户 · 管理端</footer>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { useSessionStore } from '../../store/session'
import { errorText } from '../../utils/errors'

export default {
  name: 'Login',
  data() {
    return {
      // 图标是组件对象，必须 markRaw，否则会被 data() 做成响应式（Vue 会告警）
      User: markRaw(User),
      Lock: markRaw(Lock),
      year: new Date().getFullYear(),
      form: { username: '', password: '' },
      rules: {
        username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      },
      loading: false,
      error: ''
    }
  },
  methods: {
    async onLogin() {
      const valid = await this.$refs.formRef.validate().catch(() => false)
      if (!valid) return
      this.loading = true
      this.error = ''
      try {
        const res = await useSessionStore().login(this.form.username, this.form.password)
        this.$router.push(res.home)
      } catch (e) {
        this.error = errorText(e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
}
.panel {
  width: min(400px, calc(100vw - 40px));
  padding: 40px 36px 34px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.brand {
  text-align: center;
  margin-bottom: 32px;
}
.mark {
  width: 52px;
  height: 52px;
  margin: 0 auto 16px;
  border-radius: 15px;
  background: var(--accent-gradient);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.28);
}
.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text-primary);
}
.sub {
  margin: 6px 0 0;
  font-size: var(--font-xs);
  color: var(--text-secondary);
}
.form :deep(.el-form-item) {
  margin-bottom: 18px;
}
.form :deep(.el-input__wrapper) {
  height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  background: var(--bg-page);
  border: 1px solid transparent;
  box-shadow: none;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.form :deep(.el-input__wrapper:hover) {
  border-color: var(--border-color);
}
.form :deep(.el-input__wrapper.is-focus) {
  background: var(--bg-card);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.12);
}
.form :deep(.el-input__inner) {
  font-size: 15px;
  height: 44px;
}
.form :deep(.el-form-item__error) {
  padding-left: 18px;
}
.err {
  margin: -2px 0 14px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: var(--font-sm);
  text-align: center;
}
.btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 4px;
  text-indent: 4px;
}
.foot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 24px;
  text-align: center;
  font-size: var(--font-xs);
  color: var(--text-disabled);
}
@media (max-width: 480px) {
  .panel {
    padding: 32px 24px 26px;
  }
  .foot {
    bottom: 14px;
  }
}
</style>
