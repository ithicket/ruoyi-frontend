<template>
  <div class="container" ref="container"></div>
</template>

<script setup>
import { onMounted, ref, watch, toRefs } from "vue";
import * as echarts from "echarts"; // 引入echarts

const props = defineProps({
  options: {
    type: Object,
    default: {},
    required: true,
  },
  theme: {
    type: String,
    default: "", //dark为深色模式
    required: false,
  },
});
const { options } = toRefs(props);
const container = ref(null);
const chart = ref(null);

//组件挂载后将echarts挂载在container上，并将给echarts设置传入的options
onMounted(() => {
  chart.value = echarts.init(container.value, props.options.theme);
  chart.value.setOption(props.options);
  window.addEventListener(
    "resize",
    () => {
      chart.value.resize();
    },
    false
  );
});

//监听options发生变化时，重新给echarts设置传入的options
watch(
  options,
  (newOptions) => {
    chart.value.setOption(newOptions);
  },
  { deep: true }
);
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
}
</style>