// client/src/components/TelegramWebAppGate.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Stack, Button, Alert } from '@mui/material'
import api, { setToken } from '../api.js'
import axios from 'axios'

export default function TelegramWebAppGate() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [isInWebApp, setIsInWebApp] = useState(false)

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT || 'ipotechTradeAuthDevBot'
  const tgLink = `https://t.me/${botUsername}?startapp=1`

  // 1) Примем токен через postMessage (для совместимости с виджетом)
  useEffect(() => {
    const onMessage = (ev) => {
      if (ev?.data?.type === 'tg-auth' && typeof ev.data.token === 'string') {
        localStorage.setItem('token', ev.data.token)
        setToken(ev.data.token)
        window.dispatchEvent(new Event('auth:login'))
        navigate(location.state?.from?.pathname || '/settings', { replace: true })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, location.state])

  // 2) Резерв: поймаем запись в localStorage('tg_token')
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'tg_token' && e.newValue) {
        localStorage.setItem('token', e.newValue)
        setToken(e.newValue)
        window.dispatchEvent(new Event('auth:login'))
        navigate(location.state?.from?.pathname || '/settings', { replace: true })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [navigate, location.state])

  // 3) Обработка Telegram WebApp (Mini App)
  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) {
      setIsInWebApp(true)
      const initData = window.Telegram.WebApp.initData
      authenticateWithInitData(initData)
    }
  }, [navigate, location.state])

  const authenticateWithInitData = async (initData) => {
    try {
      setError('')
      const response = await axios.post('/api/auth/telegram/web-app', { initData })
      const { token } = response.data
      if (token) {
        localStorage.setItem('token', token)
        setToken(token)
        window.dispatchEvent(new Event('auth:login'))
        navigate(location.state?.from?.pathname || '/settings', { replace: true })
      } else {
        throw new Error('Empty token in response')
      }
    } catch (e) {
      console.error('WebApp auth error:', e)
    }
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>Войти через Telegram</Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: .85 }}>
            {isInWebApp
              ? 'Аутентификация выполняется автоматически. Если ничего не происходит — обновите страницу.'
              : 'Откройте приложение через Telegram-бота и нажмите кнопку для входа.'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!isInWebApp && (
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ mb: 2 }}>
              <Button variant="contained" href={tgLink} target="_blank" rel="noopener">
                Открыть в Telegram
              </Button>
              <Button variant="outlined" onClick={() => window.location.reload()}>
                Обновить
              </Button>
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="text" component={Link} to="/">На главную</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}