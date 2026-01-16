<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="表名称" prop="tableName">
        <el-input
          v-model="queryParams.tableName"
          placeholder="请输入表名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="表描述" prop="tableComment">
        <el-input
          v-model="queryParams.tableComment"
          placeholder="请输入表描述"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
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
      <el-col :span="1.5" v-if="hasPermission('tool:gen:code')">
        <el-button type="primary" plain icon="Download" @click="handleGenTable" :disabled="multiple">生成</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('admin')">
        <el-button type="primary" plain icon="Plus" @click="openCreateTable">创建</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('tool:gen:import')">
        <el-button type="info" plain icon="Upload" @click="openImportTable" >导入</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('tool:gen:edit')">
        <el-button type="success" plain icon="Edit" @click="handleEditTable" :disabled="single">修改</el-button>
      </el-col>
      <el-col :span="1.5" v-if="hasPermission('tool:gen:remove')">
        <el-button type="danger" plain icon="Delete" @click="handleDelete" :disabled="multiple">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table ref="genRef" v-loading="loading" :data="tableList" @selection-change="handleSelectionChange" :default-sort="defaultSort" @sort-change="handleSortChange">
      <el-table-column type="selection" align="center" width="55"></el-table-column>
      <el-table-column label="序号" type="index" width="50" align="center">
        <template #default="scope">
          <span>{{(pages.pageNum - 1) * pages.pageSize + scope.$index + 1}}</span>
        </template>
      </el-table-column>
      <el-table-column label="表名称" align="center" prop="tableName" :show-overflow-tooltip="true" />
      <el-table-column label="表描述" align="center" prop="tableComment" :show-overflow-tooltip="true" />
      <el-table-column label="实体" align="center" prop="className" :show-overflow-tooltip="true" />
      <el-table-column prop="createTime" label="创建时间" align="center" width="160" sortable="custom" :sort-orders="['descending', 'ascending']">
        <template #default="scope">
          <span>{{ parseDateTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="160" sortable="custom" :sort-orders="['descending', 'ascending']" >
        <template #default="scope">
          <span>{{ parseDateTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="330" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip content="预览" placement="top" v-if="hasPermission('tool:gen:preview')">
            <el-button link type="primary" icon="View" @click="handlePreview(scope.row)"/>
          </el-tooltip>
          <el-tooltip content="编辑" placement="top" v-if="hasPermission('tool:gen:edit')">
            <el-button link type="primary" icon="Edit" @click="handleEditTable(scope.row)"/>
          </el-tooltip>
          <el-tooltip content="删除" placement="top" v-if="hasPermission('tool:gen:remove')">
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"/>
          </el-tooltip>
          <el-tooltip content="同步" placement="top" v-if="hasPermission('tool:gen:edit')">
            <el-button link type="primary" icon="Refresh" @click="handleSynchDb(scope.row)"/>
          </el-tooltip>
          <el-tooltip content="生成代码" placement="top" v-if="hasPermission('tool:gen:code')">
            <el-button link type="primary" icon="Download" @click="handleGenTable(scope.row)"/>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="pages.pageNum"
      v-model:limit="pages.pageSize"
      @pagination="getList"
    />
    <!-- 预览界面 -->
    <el-dialog :title="preview.title" v-model="preview.open" width="80%" top="5vh" append-to-body class="scrollbar">
      <el-tabs v-model="preview.activeName">
        <el-tab-pane
          v-for="(value, key) in preview.data"
          :label="key.substring(key.lastIndexOf('/')+1,key.indexOf('.vm'))"
          :name="key.substring(key.lastIndexOf('/')+1,key.indexOf('.vm'))"
          :key="value"
        >
          <el-link :underline="false" icon="DocumentCopy" v-copyText="value" v-copyText:callback="copyTextSuccess" style="float:right">&nbsp;复制</el-link>
          <pre>{{ value }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    <import-table ref="importRef" @ok="handleQuery" />
    <create-table ref="createRef" @ok="handleQuery" />
  </div>
</template>

<script setup>
import {previewTable, delTable, genCode, synchDb, pageTable} from "@/api/tool/gen"
import importTable from "./importTable"
import createTable from "./createTable"
import {useRoute} from "vue-router";
import {ElMessage, ElMessageBox} from "element-plus";
import {hasPermission} from "@/utils/permission.js";
import {parseDateTime} from "@/utils/ruoyi.js";

defineOptions({
  name: 'Gen'
})

const route = useRoute()
const { proxy } = getCurrentInstance()

const tableList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const tableNames = ref([])
const uniqueId = ref("")
const defaultSort = ref({ prop: "createTime", order: "descending" })

const pages = ref({
  pageNum: 1,
  pageSize: 10,
  orderByColumn: defaultSort.value.prop,
  isAsc: defaultSort.value.order
})

// 查询参数
const queryParams = ref({
  pages: pages,
  dateRange: [],
  tableName: undefined,
  tableComment: undefined,
})

const data = reactive({
  preview: {
    open: false,
    title: "代码预览",
    data: {},
    activeName: "domain.java"
  }
})

const { preview } = toRefs(data)

onActivated(() => {
  const time = route.query.t
  if (time != null && time !== uniqueId.value) {
    uniqueId.value = time
    pages.value.pageNum = Number(route.query.pageNum)
    queryParams.value.dateRange = []
    proxy.resetForm("queryForm")
    getList()
  }
})

/** 查询表集合 */
function getList() {
  loading.value = true
  pageTable(queryParams.value).then(response => {
    tableList.value = response.data.records
    total.value = response.data.total
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  pages.value.pageNum = 1
  getList()
}

/** 生成代码操作 */
async function handleGenTable(row) {
  const tbNames = row.tableName || tableNames.value
  if (tbNames === "") {
    ElMessage.success("请选择要生成的数据")
    return
  }
  if (row.genType === "1") {
    await genCode(row.tableName)
    ElMessage.success("成功生成到自定义路径：" + row.genPath)
  } else {
    proxy.$download.zip("/tool/gen/batchGenCode?tables=" + tbNames, "ruoyi.zip")
  }
}

/** 同步数据库操作 */
function handleSynchDb(row) {
  const tableName = row.tableName
  ElMessageBox.confirm('确认要强制同步"' + tableName + '"表结构吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return synchDb(tableName)
  }).then(() => {
    ElMessage.success("同步成功")
  }).catch(() => {
  })
}

/** 打开导入表弹窗 */
function openImportTable() {
  proxy.$refs["importRef"].show()
}

/** 打开创建表弹窗 */
function openCreateTable() {
  proxy.$refs["createRef"].show()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.$refs.queryRef && proxy.$refs.queryRef.resetFields()
  queryParams.value.dateRange = []
  pages.value.pageNum = 1
  proxy.$refs["genRef"].sort(defaultSort.value.prop, defaultSort.value.order)
}

/** 预览按钮 */
function handlePreview(row) {
  previewTable(row.tableId).then(response => {
    preview.value.data = response.data
    preview.value.open = true
    preview.value.activeName = "domain.java"
  })
}

/** 复制代码成功 */
function copyTextSuccess() {
  ElMessage.success("复制成功")
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.tableId)
  tableNames.value = selection.map(item => item.tableName)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

/** 排序触发事件 */
function handleSortChange(column) {
  pages.value.orderByColumn = column.prop
  pages.value.isAsc = column.order
  getList()
}

/** 修改按钮操作 */
function handleEditTable(row) {
  const tableId = row.tableId || ids.value[0]
  const tableName = row.tableName || tableNames.value[0]
  const params = { pageNum: pages.value.pageNum }
  proxy.$tab.openPage("修改[" + tableName + "]生成配置", '/tool/gen-edit/index/' + tableId, params)
}

/** 删除按钮操作 */
function handleDelete(row) {
  const tableIds = row.tableId || ids.value
  ElMessageBox.confirm('是否确认删除表编号为"' + tableIds + '"的数据项？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return delTable(tableIds)
  }).then(() => {
    getList()
    ElMessage.success("删除成功")
  }).catch(() => {
  })
}

getList()
</script>
