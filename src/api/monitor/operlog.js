import request from '@/utils/request'

// 查询操作日志列表
export function list(query) {
  return request({
    url: '/monitor/oper-log/list',
    method: 'get',
    params: query
  })
}

// 查询操作日志列表
export function pageLog(data) {
  return request({
    url: '/monitor/oper-log/page',
    method: 'post',
    data: data
  })
}

// 删除操作日志
export function delOperLog(data) {
  return request({
    url: '/monitor/oper-log/remove',
    method: 'delete',
    data: data
  })
}

// 清空操作日志
export function cleanOperLog() {
  return request({
    url: '/monitor/oper-log/clean',
    method: 'delete'
  })
}
