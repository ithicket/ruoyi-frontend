<template>
  <el-dialog title="Cron表达式生成器" v-model="visible" append-to-body destroy-on-close>
    <Crontab ref="crontabRef" @hide="onHide" @fill="onFill" :expression="expression"/>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import Crontab from '@/components/Crontab/index.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  expression: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue', 'fill']);

const visible = ref(props.modelValue);

watch(() => props.modelValue, v => (visible.value = v));
watch(visible, v => emit('update:modelValue', v));

function onHide() {
  visible.value = false;
}

function onFill(value) {
  visible.value = false;
  emit('fill', value);
}
</script>

<style scoped>


</style>


