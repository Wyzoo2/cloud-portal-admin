<template>
  <el-tag :type="meta.type" :effect="effect" :size="size" disable-transitions>
    {{ meta.text }}
  </el-tag>
</template>

<script>
import { computed } from 'vue'
import { RECHARGE_STATUS, USER_STATUS, ADMIN_STATUS, TRANSACTION_TYPE } from '../utils/constants'

const MAPS = {
  recharge: RECHARGE_STATUS,
  user: USER_STATUS,
  admin: ADMIN_STATUS,
  transaction: TRANSACTION_TYPE
}

export default {
  name: 'StatusTag',
  props: {
    // recharge | user | admin | transaction
    type: { type: String, required: true },
    value: { type: [Number, String], required: true },
    effect: { type: String, default: 'light' },
    size: { type: String, default: 'small' }
  },
  setup(props) {
    const meta = computed(() => {
      const map = MAPS[props.type] || {}
      return map[props.value] || { text: String(props.value), type: 'info' }
    })
    return { meta }
  }
}
</script>
