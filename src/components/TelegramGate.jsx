import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Stack, Button, Alert, Tooltip } from '@mui/material'
import api, { setToken } from '../api.js'
import TelegramWebAppGate from './TelegramWebAppGate.jsx'

export default function TelegramGate() {
  {<TelegramWebAppGate />}
  const ref = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT || 'ipotechTradeAuthDevBot'
  const authUrl = `${window.location.origin}/api/auth/telegram/callback`

  // 1) Примем токен через postMessage (основной канал)
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

  // 2) Резерв: поймаем запись в localStorage('tg_token') из /callback (сработает даже без opener)
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

  // Рендерим виджет в режиме data-auth-url
  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) return
    const s = document.createElement('script')
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.async = true
    s.setAttribute('data-telegram-login', botUsername)
    s.setAttribute('data-size', 'large')
    s.setAttribute('data-auth-url', authUrl)       // ключевой канал
    s.setAttribute('data-request-access', 'write') // рекомендовано
    s.onerror = () => setError('Не удалось загрузить Telegram Login Widget')
    if (ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(s)
    }
    return () => { if (ref.current?.firstChild) ref.current.removeChild(ref.current.firstChild) }
  }, [botUsername, authUrl])

  // Dev-вход
  const devEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === '1'
  async function handleDevLogin() {
    try {
      setError('')
      const tgId = import.meta.env.VITE_DEV_TGID || '999000'
      const username = import.meta.env.VITE_DEV_USERNAME || 'DevUser'
      const { data } = await api.post('/auth/dev/login',
        { tgId, username, firstName: 'Dev', lastName: 'User' },
        { headers: { 'x-dev-auth': import.meta.env.VITE_DEV_AUTH_HEADER || '' } }
      )
      if (!data?.token) throw new Error('Empty token in dev response')
      localStorage.setItem('token', data.token)
      setToken(data.token)
      window.dispatchEvent(new Event('auth:login'))
      navigate(location.state?.from?.pathname || '/settings', { replace: true })
    } catch (e) {
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
          <div ref={ref} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="text" component={Link} to="/">На главную</Button>
            {devEnabled && (
              <Tooltip title="Фейковый вход для разработки">
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
