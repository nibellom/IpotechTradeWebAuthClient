// client/src/api.js
import axios from 'axios'

// по умолчанию ходим через прокси Vite → '/api'
const baseURL = (import.meta.env.VITE_API_BASE?.trim()) || '/api'

const api = axios.create({ baseURL })

// ВАЖНО: добавляем спец-заголовок для обхода ngrok interstitial
api.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers || {}
  cfg.headers['ngrok-skip-browser-warning'] = 'true'
  return cfg
})

export function setToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export default api
