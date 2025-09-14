// client/src/api.js
import axios from 'axios'

// Базовый URL: из VITE_API_BASE или через прокси на '/api'
const rawBase = import.meta.env.VITE_API_BASE?.trim()
const baseURL = rawBase && rawBase !== '' ? rawBase.replace(/\/+$/, '') : '/api'
console.log('[api] baseURL =', baseURL)

const api = axios.create({
  baseURL,
  timeout: 20000, // чтобы зависшие запросы не ломали UX
})

// --- Bootstrap токена при старте приложения ---
const bootToken = localStorage.getItem('token')
if (bootToken) {
  api.defaults.headers.common.Authorization = `Bearer ${bootToken}`
}

// --- Request interceptor: подставляем токен из localStorage в каждый запрос ---
api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const t = localStorage.getItem('token')
    if (t) config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

// --- Response interceptor: на 401 — чистим токен и уведомляем приложение ---
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      try {
        localStorage.removeItem('token')
        delete api.defaults.headers.common.Authorization
        // дайте приложению знать: можно сбросить стейт, перекинуть на /login и т.п.
        window.dispatchEvent(new Event('auth:logout'))
      } catch {}
    }
    return Promise.reject(err)
  }
)

// Экспортируем хелпер для явной установки/сброса токена после логина/логаута
export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token)
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    localStorage.removeItem('token')
    delete api.defaults.headers.common.Authorization
  }
}

export default api
