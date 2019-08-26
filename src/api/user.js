import request from '@/utils/request'

export function login(data) {
  return request.post('/user/login', data)
}

export function getInfo(token) {
  return request.post('/user/info', { token })
}

export function logout() {
  return request.post('/user/logout')
}

