<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="参数名称" prop="configName">
        <el-input
            v-model="queryParams.configName"
            placeholder="请输入参数名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="参数键名" prop="configKey">
        <el-input
            v-model="queryParams.configKey"
            placeholder="请输入参数键名"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="系统内置" prop="configType">
        <el-select v-model="queryParams.configType" placeholder="系统内置" clearable style="width: 240px">
          <el-option
              v-for="dict in sys_yes_no"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="width: 308px;">
        <el-date-picker
            v-model="queryParams.dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5" v-if="hasPermission('system:config:add')">
        <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('system:config:edit')">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate">修改</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('system:config:remove')">
        <el-button type="danger" plain icon="Delete" @click="handleDelete" :disabled="multiple">删除</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('system:config:export')">
        <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('system:config:remove')">
        <el-button type="danger" plain icon="Refresh" @click="handleRefreshCache">刷新缓存</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="configList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="参数主键" align="center" prop="configId"/>
      <el-table-column label="参数名称" align="center" prop="configName" :show-overflow-tooltip="true"/>
      <el-table-column label="参数键名" align="center" prop="configKey" :show-overflow-tooltip="true"/>
      <el-table-column label="参数键值" align="center" prop="configValue" :show-overflow-tooltip="true"/>
      <el-table-column label="系统内置" align="center" prop="configType">
        <template #default="scope">
          <dict-tag :options="sys_yes_no" :value="scope.row.configType"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseDateTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                     v-if="hasPermission('system:config:edit')">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                     v-if="hasPermission('system:config:remove')">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="pages.pageNum"
        v-model:limit="pages.pageSize"
        @pagination="getList"
    />

    <!-- 添加或修改参数配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="configRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入参数名称"/>
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入参数键名"/>
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-input v-model="form.configValue" type="textarea" placeholder="请输入参数键值"/>
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-radio-group v-model="form.configType">
            <el-radio
                v-for="dict in sys_yes_no"
                :key="dict.value"
                :value="dict.value"
            >{{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  getConfig,
  delConfig,
  addConfig,
  updateConfig,
  refreshCache,
  pageConfig,
  sendConfigExport
} from "@/api/system/config"
import {parseDateTime} from "@/utils/ruoyi.js";
import {ElMessage, ElMessageBox} from "element-plus";
import {hasPermission} from "@/utils/permission.js";

defineOptions({
  name: 'Config'
})

const {proxy} = getCurrentInstance()
const {sys_yes_no} = proxy.useDict("sys_yes_no")

const configList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const pages = ref({
  pageNum: 1,
  pageSize: 10,
})

// 查询参数
const queryParams = ref({
  pages: pages,
  dateRange: [],
  configName: undefined,
  configKey: undefined,
  configType: undefined
})

const data = reactive({
  form: {},
  rules: {
    configName: [{required: true, message: "参数名称不能为空", trigger: "blur"}],
    configKey: [{required: true, message: "参数键名不能为空", trigger: "blur"}],
    configValue: [{required: true, message: "参数键值不能为空", trigger: "blur"}]
  }
})

const {form, rules} = toRefs(data)

/** 查询参数列表 */
function getList() {
  loading.value = true
  pageConfig(queryParams.value).then(response => {
    configList.value = response.data.records
    total.value = response.data.total
    loading.value = false
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    configId: undefined,
    configName: undefined,
    configKey: undefined,
    configValue: undefined,
    configType: "Y",
    remark: undefined
  }
  proxy.resetForm("configRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  pages.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.$refs.queryRef && proxy.$refs.queryRef.resetFields()
  queryParams.value.dateRange = []
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.configId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加参数"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const configId = row.configId || ids.value
  getConfig(configId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改参数"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["configRef"].validate(async valid => {
    if (valid) {
      if (form.value.configId !== undefined) {
        await updateConfig(form.value)
        ElMessage.success("修改成功")
        open.value = false
        getList()
      } else {
        await addConfig(form.value)
        ElMessage.success("新增成功")
        open.value = false
        getList()
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const tmp = row.configId ? [row.configId] : ids.value;

  if (tmp.length === 0) {
    ElMessage.warning("请选择要删除的数据");
    return;
  }

  ElMessageBox.confirm('是否确认删除选中的数据项?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return delConfig(tmp)
  }).then(() => {
    getList()
    ElMessage.success("删除成功")
  }).catch(() => {
  })
}

/** 导出按钮操作 */
function handleExport() {
  sendConfigExport(queryParams.value)
      .then(response => {
        saveAs(response, `配置导出_${new Date().toLocaleString('zh-CN')}.xlsx`)
        ElMessage.success('Success')
      })
}

/** 刷新缓存按钮操作 */
function handleRefreshCache() {
  refreshCache().then(() => {
    ElMessage.success("刷新缓存成功")
  })
}

getList()
</script>
