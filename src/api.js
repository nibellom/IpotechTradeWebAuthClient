// client/src/api.js
import axios from 'axios'

// по умолчанию ходим через прокси Vite → '/api'
const baseURL = (import.meta.env.VITE_API_BASE?.trim()) || '/api'
console.log('[api] baseURL =', baseURL)

const api = axios.create({ baseURL })

export function setToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export default api
