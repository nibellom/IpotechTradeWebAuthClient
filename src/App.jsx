import { useEffect, useState, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Box, Container, CircularProgress } from '@mui/material'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import Settings from './pages/Settings.jsx'
import Referrals from './pages/Referrals.jsx'
import Terms from './pages/Terms.jsx'
import Dashboard from './components/Dashboard.jsx'
import api, { setToken } from './api.js'
import TelegramGate from './components/TelegramGate.jsx'
import More from './pages/More.jsx'
import ApiKeysGuide from './pages/ApiKeysGuide.jsx'
import { initGA, sendPageview } from './analytics'

function Protected({ authed, children }) {
  const location = useLocation()
  if (!authed) return <Navigate to="/signin" replace state={{ from: location }} />
  return children
}

export default function App() {
  const [booting, setBooting] = useState(true)
  const [me, setMe] = useState(null)
  const authed = useMemo(() => Boolean(me), [me])

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
    setMe(null)
    window.dispatchEvent(new Event('auth:logout'))
  }

  // ⬇️ ВАЖНО: объявляем fetchMeWith ДО всех useEffect, которые его используют
  const fetchMeWith = useMemo(() => {
    return async (token) => {
      try {
        setToken(token)
        const { data } = await api.get('/users/me')
        setMe(data)
      } catch (e) {
        console.warn('Token invalid, clearing…', e?.response?.status || e?.message)
        localStorage.removeItem('token')
        setToken(null)
        setMe(null)
      } finally {
        setBooting(false)
      }
    }
  }, [])

  // Парсим токен, присланный сервером в #tg_jwt
  useEffect(() => {
    const m = window.location.hash.match(/tg_jwt=([^&]+)/)
    if (m) {
      const token = decodeURIComponent(m[1])
      localStorage.setItem('token', token)
      setToken(token)
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      void fetchMeWith(token)
    }
  }, [fetchMeWith])

  // GA init (один раз)
  useEffect(() => {
    initGA()
  }, [])

  // Инициализация auth: localStorage или Telegram WebApp initData
  useEffect(() => {
    const stored = localStorage.getItem('token')

    async function loginViaTelegram(initData) {
      try {
        console.log('[WebApp] Attempting authentication with initData')
        const resp = await api.post('/auth/telegram/web-app', { initData })
        const { token } = resp.data
        if (!token) {
          throw new Error('No token received')
        }
        localStorage.setItem('token', token)
        await fetchMeWith(token)
      } catch (e) {
        console.error('[WebApp] Telegram auth failed:', e?.response?.data || e?.message)
        setBooting(false)
      }
    }

    async function getInitData() {
      // Проверяем наличие Telegram WebApp SDK
      if (!window.Telegram?.WebApp) {
        return null
      }

      const tg = window.Telegram.WebApp
      
      // Инициализируем WebApp
      try {
        tg.ready()
        tg.expand()
      } catch (e) {
        console.warn('[WebApp] Error initializing:', e)
      }

      // initData должен быть доступен сразу
      const initData = tg.initData
      if (initData && initData.length > 0) {
        return initData
      }

      return null
    }

    async function tryTelegramWebAppAuth(maxAttempts = 20) {
      // Пытаемся получить initData несколько раз с задержками
      for (let i = 0; i < maxAttempts; i++) {
        const initData = await getInitData()
        if (initData) {
          console.log('[WebApp] Found initData on attempt', i + 1)
          return initData
        }
        // Небольшая задержка перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 150))
      }
      return null
    }

    (async () => {
      if (stored) {
        console.log('[Auth] Using stored token')
        await fetchMeWith(stored)
      } else {
        // Пытаемся аутентифицироваться через Telegram WebApp
        console.log('[Auth] No stored token, trying WebApp auth...')
        
        // Даём время скрипту загрузиться
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const initData = await tryTelegramWebAppAuth()
        if (initData) {
          console.log('[Auth] WebApp initData found, authenticating...')
          await loginViaTelegram(initData)
        } else {
          console.log('[Auth] WebApp auth not available - showing unauthenticated state')
          setBooting(false)
        }
      }
    })()
  }, [fetchMeWith])

  // Событие логина извне (если где-то поставите window.dispatchEvent('auth:login'))
  useEffect(() => {
    async function onAuthLogin() {
      const token = localStorage.getItem('token')
      if (token) await fetchMeWith(token)
    }
    window.addEventListener('auth:login', onAuthLogin)
    return () => window.removeEventListener('auth:login', onAuthLogin)
  }, [fetchMeWith])

  // GA page_view
  const location = useLocation()
  useEffect(() => {
    sendPageview(location.pathname + location.search)
  }, [location])

  if (booting) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Header authed={authed} me={me} onLogout={handleLogout} />
      <Container sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<Home me={me} />} />
          <Route path="/more" element={<More />} />
          <Route path="/keys-help" element={<ApiKeysGuide />} />
          <Route path="/signin" element={<TelegramGate />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/settings"
            element={
              <Protected authed={authed}>
                <Settings me={me} />
              </Protected>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Protected authed={authed}>
                <Dashboard me={me} />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Container>
    </Box>
  )
}
