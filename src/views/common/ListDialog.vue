<template>
  <el-dialog :title="title" v-model="visible" class="list-dialog" width="700px" append-to-body>
    <div class="list-dialog-content">
      <el-scrollbar class="list-scrollbar">
        <div class="list-container">
          <el-tag
              v-for="(item, idx) in items"
              :key="idx"
              class="list-item"
              type="info"
              size="small"
          >
            {{ item }}
          </el-tag>
        </div>
      </el-scrollbar>
    </div>
    <template #footer>
      <el-button type="primary" @click="copyAllItems"> 复制</el-button>
      <el-button type="info" @click="handleClose"> 关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {ElMessage} from "element-plus";

const props = defineProps({
  title: {
    type: String,
    default: "列表详情"
  },
  activeSwitch: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => []
  },
});

const emit = defineEmits(['update:activeSwitch']);

const visible = computed({
  get: () => props.activeSwitch,
  set: (val) => {
    emit('update:activeSwitch', val);
  }
})

// 关闭弹窗
function handleClose() {
  visible.value = false;
}

function copyAllItems() {
  if (!props.items || props.items.length === 0) {
    ElMessage.warning("没有可复制的账号数据");
    return;
  }

  const accountsText = props.items.join('\n');

  navigator.clipboard.writeText(accountsText).then(() => {
    ElMessage.success("账号列表已复制到剪贴板");
  }).catch(err => {
    ElMessage.error("复制失败: " + err);
  });
}
</script>

<style lang="scss" scoped>
.list-dialog .el-dialog__body {
  padding: 12px 20px;
  height: 320px;
  box-sizing: border-box;
  overflow: hidden;
}

.list-scrollbar {
  height: 100%;
}


.list-scrollbar .el-scrollbar__wrap {
  height: 100% !important;
  max-height: 100% !important;
  overflow: auto !important;
}

.list-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;

  .list-item {
    margin: 4px 0;
  }
}
</style>

