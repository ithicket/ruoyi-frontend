<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="字典名称" prop="dictName">
        <el-input
            v-model="queryParams.dictName"
            placeholder="请输入字典名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="字典类型" prop="dictType">
        <el-input
            v-model="queryParams.dictType"
            placeholder="请输入字典类型"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
            v-model="queryParams.status"
            placeholder="字典状态"
            clearable
            style="width: 240px"
        >
          <el-option
              v-for="dict in sys_normal_disable"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="width: 308px">
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
      <el-col :span="1.5" v-if="hasPermission('system:dict:add')">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('system:dict:edit')">
        <el-button type="success" plain icon="Edit" @click="handleUpdate" :disabled="single">修改</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('system:dict:remove')">
        <el-button type="danger" plain icon="Delete" @click="handleDelete" :disabled="multiple">删除</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('system:dict:export')">
        <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('system:dict:remove')">
        <el-button type="danger" plain icon="Refresh" @click="handleRefreshCache">刷新缓存</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="typeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="字典编号" align="center" prop="dictId"/>
      <el-table-column label="字典名称" align="center" prop="dictName" :show-overflow-tooltip="true"/>
      <el-table-column label="字典类型" align="center" :show-overflow-tooltip="true">
        <template #default="scope">
          <router-link :to="'/system/dict-data/index/' + scope.row.dictId" class="link-type">
            <span>{{ scope.row.dictType }}</span>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseDateTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                     v-if="hasPermission('system:dict:edit')">修改
          </el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                     v-if="hasPermission('system:dict:remove')">删除
          </el-button>
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
      <el-form ref="dictRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="form.dictName" placeholder="请输入字典名称"/>
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model="form.dictType" placeholder="请输入字典类型"/>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
                v-for="dict in sys_normal_disable"
                :key="dict.value"
                :value="dict.value"
            >{{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
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
import useDictStore from '@/store/modules/dict'
import {getType, delType, addType, updateType, refreshCache, pageType, sendDictTypeExport} from "@/api/system/dict/type"
import {parseDateTime} from "@/utils/ruoyi.js";
import {ElMessage, ElMessageBox} from "element-plus";
import {hasPermission} from "@/utils/permission.js";

defineOptions({
  name: 'Dict'
})

const {proxy} = getCurrentInstance()
const {sys_normal_disable} = proxy.useDict("sys_normal_disable")

const typeList = ref([])
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
  dictName: undefined,
  dictType: undefined,
  status: undefined
})


const data = reactive({
  form: {},
  rules: {
    dictName: [{required: true, message: "字典名称不能为空", trigger: "blur"}],
    dictType: [{required: true, message: "字典类型不能为空", trigger: "blur"}]
  },
})

const {form, rules} = toRefs(data)

/** 查询字典类型列表 */
function getList() {
  loading.value = true
  pageType(queryParams.value).then(response => {
    typeList.value = response.data.records
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
    dictId: undefined,
    dictName: undefined,
    dictType: undefined,
    status: "0",
    remark: undefined
  }
  proxy.$refs.dictRef && proxy.$refs.dictRef.resetFields()
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

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加字典类型"
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.dictId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const dictId = row.dictId || ids.value
  getType(dictId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改字典类型"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["dictRef"].validate(async valid => {
    if (valid) {
      if (form.value.dictId !== undefined) {
        await updateType(form.value)
        ElMessage.success("修改成功")
        open.value = false
        getList()
      } else {
        await addType(form.value)
        ElMessage.success("新增成功")
        open.value = false
        getList()
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const tmp = row.dictId ? [row.dictId] : ids.value;
  if (tmp.length === 0) {
    ElMessage.warning("请选择要删除的数据");
    return;
  }

  ElMessageBox.confirm('是否确认删除选中的数据项?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return delType(tmp)
  }).then(() => {
    getList()
    ElMessage.success("删除成功")
  }).catch(() => {
  })
}

/** 导出按钮操作 */
function handleExport() {
  sendDictTypeExport(queryParams.value)
      .then(response => {
        saveAs(response, `字典导出_${new Date().toLocaleString('zh-CN')}.xlsx`)
        ElMessage.success('Success')
      })
}

/** 刷新缓存按钮操作 */
function handleRefreshCache() {
  refreshCache().then(() => {
    ElMessage.success("刷新成功")
    useDictStore().cleanDict()
  })
}

getList()
</script>
