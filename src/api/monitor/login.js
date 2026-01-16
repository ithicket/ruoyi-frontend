import request from '@/utils/request'

// 查询登录日志列表
export function list(query) {
  return request({
    url: '/monitor/login-log/list',
    method: 'get',
    params: query
  })
}

// 查询登录日志列表
export function pageLogin(data) {
  return request({
    url: '/monitor/login-log/page',
    method: 'post',
    data: data
  })
}

// 删除登录日志
export function delLogin(data) {
  return request({
    url: '/monitor/login-log/remove',
    method: 'delete',
    data: data,
  })
}

// 解锁用户登录状态
export function unlockLogin(username) {
  return request({
    url: '/monitor/login-log/unlock/' + username,
    method: 'get'
  })
}

// 清空登录日志
export function cleanLogin() {
  return request({
    url: '/monitor/login-log/clean',
    method: 'delete'
  })
}

export function sendLoginExport(data) {
  return request({
    url: '/monitor/login-log/export',
    method: 'post',
    data: data,
    responseType: 'blob'
  })
}
