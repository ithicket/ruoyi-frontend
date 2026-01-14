import request from '@/utils/request'


// 分页查询调度日志列表
export function sendJobLogPage(data) {
  return request({
    url: '/monitor/jobLog/page',
    method: 'post',
    data: data
  })
}

// 删除调度日志
export function delJobLog(data) {
  return request({
    url: '/monitor/jobLog/delete',
    method: 'delete',
    data: data
  })
}

// 清空调度日志
export function cleanJobLog() {
  return request({
    url: '/monitor/jobLog/clean',
    method: 'delete'
  })
}
