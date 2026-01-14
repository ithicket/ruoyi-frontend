import request from '@/utils/request'


// 分页查询定时任务调度列表
export function pageJob(data) {
  return request({
    url: '/monitor/job/page',
    method: 'post',
    data: data
  })
}

// 查询定时任务调度详细
export function getJob(jobId) {
  return request({
    url: '/monitor/job/detail/' + jobId,
    method: 'get',
  })
}

// 新增定时任务调度
export function addJob(data) {
  return request({
    url: '/monitor/job',
    method: 'post',
    data: data
  })
}

// 修改定时任务调度
export function updateJob(data) {
  return request({
    url: '/monitor/job',
    method: 'put',
    data: data
  })
}

// 删除定时任务调度
export function delJob(data) {
  return request({
    url: '/monitor/job',
    method: 'delete',
    data: data
  })
}

// 任务状态修改
export function changeJobStatus(data) {
  return request({
    url: '/monitor/job/changeStatus',
    method: 'put',
    data: data
  })
}


// 定时任务立即执行一次
export function runJob(jobId, jobGroup) {
  const data = {
    jobId,
    jobGroup
  }
  return request({
    url: '/monitor/job/run',
    method: 'put',
    data: data
  })
}