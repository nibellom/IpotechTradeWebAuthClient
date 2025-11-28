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

  // Функция для отправки логов на сервер (для отладки)
  const sendDebugLog = (message, data = null, level = 'info') => {
    console.log(`[${level.toUpperCase()}]`, message, data || '')
    // Отправляем на сервер для отладки (неблокирующе)
    api.post('/auth/debug/log', { message, data, level }).catch(() => {})
  }

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
        sendDebugLog('Attempting authentication with initData', { initDataLength: initData?.length })
        const resp = await api.post('/auth/telegram/web-app', { initData })
        const { token } = resp.data
        if (!token) {
          throw new Error('No token received')
        }
        localStorage.setItem('token', token)
        sendDebugLog('Authentication successful, fetching user data')
        await fetchMeWith(token)
      } catch (e) {
        sendDebugLog('Telegram auth failed', { error: e?.response?.data || e?.message }, 'error')
        setBooting(false)
      }
    }

    async function getInitData() {
      // Проверяем наличие Telegram WebApp SDK
      if (!window.Telegram?.WebApp) {
        sendDebugLog('Telegram.WebApp not available', {
          hasTelegram: !!window.Telegram,
          userAgent: navigator.userAgent
        }, 'warn')
        return null
      }

      const tg = window.Telegram.WebApp
      sendDebugLog('Telegram.WebApp found', {
        version: tg.version,
        platform: tg.platform,
        initDataUnsafe: !!tg.initDataUnsafe
      })
      
      // Инициализируем WebApp
      try {
        tg.ready()
        tg.expand()
        sendDebugLog('WebApp initialized', { ready: true })
      } catch (e) {
        sendDebugLog('Error initializing WebApp', { error: e.message }, 'error')
      }

      // initData должен быть доступен сразу
      let initData = tg.initData
      
      // Если initData пуст, проверяем initDataUnsafe (для диагностики)
      if (!initData || initData.length === 0) {
        sendDebugLog('initData empty, checking initDataUnsafe', {
          hasInitDataUnsafe: !!tg.initDataUnsafe,
          initDataUnsafeKeys: tg.initDataUnsafe ? Object.keys(tg.initDataUnsafe) : []
        }, 'warn')
        
        // initDataUnsafe может содержать те же данные, но в виде объекта
        // Это может помочь понять, почему initData пуст
        if (tg.initDataUnsafe?.user) {
          sendDebugLog('initDataUnsafe contains user data', {
            userId: tg.initDataUnsafe.user?.id,
            username: tg.initDataUnsafe.user?.username
          }, 'info')
        }
      }
      
      if (initData && initData.length > 0) {
        sendDebugLog('initData found', { length: initData.length })
        return initData
      }

      sendDebugLog('initData not available', {
        hasInitData: !!initData,
        initDataLength: initData?.length || 0,
        hasInitDataUnsafe: !!tg.initDataUnsafe
      }, 'warn')
      return null
    }

    async function tryTelegramWebAppAuth(maxAttempts = 30) {
      // Пытаемся получить initData несколько раз с задержками
      for (let i = 0; i < maxAttempts; i++) {
        const initData = await getInitData()
        if (initData) {
          sendDebugLog(`Found initData on attempt ${i + 1}`)
          return initData
        }
        // Небольшая задержка перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      sendDebugLog(`initData not found after ${maxAttempts} attempts`, null, 'error')
      return null
    }

    (async () => {
      if (stored) {
        sendDebugLog('Using stored token')
        await fetchMeWith(stored)
      } else {
        // Пытаемся аутентифицироваться через Telegram WebApp
        sendDebugLog('No stored token, trying WebApp auth', {
          url: window.location.href,
          hasTelegram: !!window.Telegram
        })
        
        // Даём время скрипту загрузиться (увеличиваем задержку)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const initData = await tryTelegramWebAppAuth()
        if (initData) {
          sendDebugLog('WebApp initData found, authenticating')
          await loginViaTelegram(initData)
        } else {
          sendDebugLog('WebApp auth not available - showing unauthenticated state', null, 'warn')
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
