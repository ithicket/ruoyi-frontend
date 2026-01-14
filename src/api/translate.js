
import request from '@/utils/request'

// 获取翻译详细信息
export function getTranslateInfo(userId) {
    return request({
      url: '/ws/translate/selectTranslateConfig',
      method: 'get',
      params: { userId }
    })
  }
  // 修改翻译详细信息
  export function putTranslateInfo(data) {
    return request({
      url: '/ws/translate',
      method: 'PUT',
      data: data
    })
  }