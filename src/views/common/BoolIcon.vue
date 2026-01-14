
<template>
  <span :class="{
    'bool-icon-true': value === true,
    'bool-icon-false': value === false,
    'bool-icon-null': value !== true && value !== false
  }">
    <template v-if="value === true">✔</template>
    <template v-else-if="value === false">✘</template>
    <template v-else>-</template>
  </span>
</template>

<script setup>
defineProps({
  value: {
    type: Boolean,
    default: null
  }
})
</script>

<style scoped lang="scss">
.bool-icon-true {
  color: #67C23A;
}
.bool-icon-false {
  color: #F56C6C;
}
.bool-icon-null {
  color: #909399;
}
</style>