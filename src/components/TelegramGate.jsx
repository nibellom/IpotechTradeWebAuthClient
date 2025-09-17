// client/src/components/TelegramGate.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Stack, Button, Alert, Tooltip } from '@mui/material'
import api, { setToken } from '../api.js'

export default function TelegramGate() {
  const ref = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT || 'ipotechTradeAuthDevBot'
  // callback на вашем сервере (возвращает мини-страницу с postMessage)
  const authUrl = `${window.location.origin}/api/auth/telegram/callback`

  // Принимаем токен из /callback (postMessage) и логинимся в SPA
  useEffect(() => {
    const onMessage = (ev) => {
      // токен шлёт страница с того же origin (через Vercel rewrite)
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

  // Рендерим официальный виджет только с data-auth-url
  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) return // внутри Telegram WebApp виджет не нужен

    const s = document.createElement('script')
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.async = true
    s.setAttribute('data-telegram-login', botUsername) // без @
    s.setAttribute('data-size', 'large')
    s.setAttribute('data-auth-url', authUrl)           // ключевое
    s.setAttribute('data-request-access', 'write')     // просим право писать (рекомендуется)
    s.onerror = () => setError('Не удалось загрузить Telegram Login Widget')

    if (ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(s)
    }
    return () => {
      if (ref.current?.firstChild) ref.current.removeChild(ref.current.firstChild)
    }
  }, [botUsername, authUrl])

  // Кнопка Dev-входа (по заголовку x-dev-auth)
  const devEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === '1'
  async function handleDevLogin() {
    try {
      setError('')
      const tgId = import.meta.env.VITE_DEV_TGID || '999000'
      const username = import.meta.env.VITE_DEV_USERNAME || 'DevUser'
      const { data } = await api.post(
        '/auth/dev/login',
        { tgId, username, firstName: 'Dev', lastName: 'User' },
        { headers: { 'x-dev-auth': import.meta.env.VITE_DEV_AUTH_HEADER || '' } }
      )
      if (!data?.token) throw new Error('Empty token in dev response')
      localStorage.setItem('token', data.token)
      setToken(data.token)
      window.dispatchEvent(new Event('auth:login'))
      navigate(location.state?.from?.pathname || '/settings', { replace: true })
    } catch (e) {
      console.error('[TG] Dev login failed:', e?.response?.status, e?.response?.data || e?.message)
      setError('Dev-вход не удался. Проверьте DEV_AUTH_SECRET на сервере.')
    }
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>Войти через Telegram</Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: .85 }}>
            Нажмите кнопку Telegram ниже и подтвердите вход в приложении Telegram.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Здесь появится кнопка Telegram Login Widget */}
          <div ref={ref} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="text" component={Link} to="/">На главную</Button>

            {devEnabled && (
              <Tooltip title="Фейковый вход для разработки (только для DEV окружения)">
                <Button variant="outlined" color="secondary" onClick={handleDevLogin}>
                  Войти (DEV)
                </Button>
              </Tooltip>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
