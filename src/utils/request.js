import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

axios.defaults.baseURL = process.env.VUE_APP_BASE_API
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8'
axios.defaults.timeout = 5000

/**
 * axios短时间內的重复请求取消前置未完成请求保证始终获取最新结果。
 * CancelToken 取消令牌
 * pending 用于存储每个ajax请求的取消函数和ajax标识
 */
const pending = []
const CancelToken = axios.CancelToken

const removePending = (config) => {
  for (const p in pending) {
    if (pending[p].url === config.url + ':' + config.method) {
      pending[p].cancel('取消请求')
      pending.splice(p, 1) // 把这条记录从数组中移除
    }
  }
}

// request interceptor
axios.interceptors.request.use(
  config => {
    removePending(config) // 在一个请求发送前执行一下取消操作
    config.cancelToken = new CancelToken(c => {
      pending.push({ url: config.url + ':' + config.method, cancel: c })
    })

    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers['X-Token'] = getToken()
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
axios.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const res = response.data

    // if the custom code is not 20000, it is judged as an error.
    if (res.code !== 20000) {
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        // to re-login
        MessageBox.confirm('You have been logged out, you can cancel to stay on this page, or log in again', 'Confirm logout', {
          confirmButtonText: 'Re-Login',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error) // for debug
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

function apiAxios(method, url, params) {
  return new Promise((resolve, reject) => {
    axios({
      method,
      url,
      data: params,
      withCredentials: true // 设置 withCredentials 使请求带上 `cookies`
    })
      .then(res => { resolve(res) })
      .catch(rej => { reject(rej) })
  })
}

export default {
  get: function(url) {
    return apiAxios('GET', url)
  },
  post: function(url, params) {
    return apiAxios('POST', url, params)
  },
  put: function(url, params) {
    return apiAxios('PUT', url, params)
  },
  delete: function(url, params) {
    return apiAxios('DELETE', url, params)
  }
}
