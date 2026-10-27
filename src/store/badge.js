/** 顶栏待核销角标（共享状态，核销页操作后能立刻反映到布局） */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rechargeApi } from '../api/recharges'

export const useBadgeStore = defineStore('badge', () => {
  const pending = ref(0)

  /** 拉取待核销数量；失败时保持原值，不打扰页面 */
  async function refresh() {
    try {
      pending.value = await rechargeApi.pendingCount()
    } catch (e) {
      // 后端不可用时保留上一次的值
    }
    return pending.value
  }

  return { pending, refresh }
})
