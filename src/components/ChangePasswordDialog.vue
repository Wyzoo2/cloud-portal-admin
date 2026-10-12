<template>
  <el-dialog :model-value="modelValue" title="修改密码" width="420px" append-to-body
    @update:model-value="v => $emit('update:modelValue', v)" @closed="onClosed">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="104px" @submit.prevent>
      <el-form-item label="当前密码" prop="old_password">
        <el-input v-model="form.old_password" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="new_password">
        <el-input v-model="form.new_password" type="password" show-password
          placeholder="8-64 位，含字母和数字" />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirm">
        <el-input v-model="form.confirm" type="password" show-password />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { errorText } from '../utils/errors'

export default {
  name: 'ChangePasswordDialog',
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data() {
    const confirmValidator = (rule, value, cb) => {
      if (value !== this.form.new_password) cb(new Error('两次输入的新密码不一致'))
      else cb()
    }
    return {
      form: { old_password: '', new_password: '', confirm: '' },
      rules: {
        old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
        new_password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { pattern: /^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/, message: '8-64 位且同时含字母和数字', trigger: 'blur' }
        ],
        confirm: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: confirmValidator, trigger: 'blur' }
        ]
      },
      submitting: false
    }
  },
  methods: {
    async onSubmit() {
      const valid = await this.$refs.formRef.validate().catch(() => false)
      if (!valid) return
      this.submitting = true
      try {
        await authApi.changePassword(this.form.old_password, this.form.new_password)
        this.$emit('update:modelValue', false)
        this.$message.success('密码已修改，请重新登录')
        // 改密会吊销该账号全部会话（含当前设备）
        useAuthStore().setSession('', null)
        this.$router.push('/login')
      } catch (e) {
        this.$message.error(errorText(e))
      } finally {
        this.submitting = false
      }
    },
    onClosed() {
      this.$refs.formRef && this.$refs.formRef.resetFields()
    }
  }
}
</script>
