<template>
  <el-card shadow="never" class="wrap">
    <template #header>
      <div class="head">
        <span>企业信息</span>
        <StatusTag v-if="ent" type="enterprise" :value="ent.status" />
      </div>
    </template>

    <template v-if="ent">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="企业名称">{{ ent.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业编码">{{ ent.code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <StatusTag type="enterprise" :value="ent.status" />
        </el-descriptions-item>
        <el-descriptions-item label="成员数">{{ ent.member_count == null ? '-' : ent.member_count }}</el-descriptions-item>
        <el-descriptions-item label="我的身份">{{ ent.is_owner ? '主管理员' : '管理员' }}</el-descriptions-item>
        <el-descriptions-item label="到期时间">
          {{ ent.expire_at ? formatTime(ent.expire_at) : '长期' }}
        </el-descriptions-item>
        <el-descriptions-item label="企业 ID">{{ ent.id || '-' }}</el-descriptions-item>
      </el-descriptions>
    </template>

    <div v-else class="empty-tip">未获取到企业信息</div>
  </el-card>
</template>

<script>
import { useSessionStore } from '../../store/session'
import { formatTime } from '../../utils/format'
import StatusTag from '../../components/StatusTag.vue'

export default {
  name: 'MyEnterprise',
  components: { StatusTag },
  computed: {
    ent() {
      return useSessionStore().enterprise
    }
  },
  methods: {
    formatTime
  }
}
</script>

<style scoped>
.wrap {
  max-width: 900px;
}
.head {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.empty-tip {
  padding: var(--space-lg);
  color: var(--text-disabled);
  font-size: var(--font-sm);
}
</style>
