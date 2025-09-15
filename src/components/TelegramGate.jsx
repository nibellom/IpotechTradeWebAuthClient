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

  useEffect(() => {
    async function onTelegramAuth(user) {
      try {
        // user = { id, first_name, last_name, username, photo_url, auth_date, hash }
        const { data } = await api.post('/auth/telegram/login', user)
        if (!data?.token) throw new Error('Empty token')
        localStorage.setItem('token', data.token)
        setToken(data.token)
        window.dispatchEvent(new Event('auth:login'))
        navigate(location.state?.from?.pathname || '/settings', { replace: true })
      } catch (e) {
        console.error('[TG] onAuth error:', e?.response?.status, e?.response?.data || e?.message)
        setError('Не удалось войти через Telegram. Проверьте /setdomain у BotFather и токен бота.')
      }
    }
    window.onTelegramAuth = onTelegramAuth

    // В Telegram Mini App виджет не нужен — там отдельный поток initData
    if (window.Telegram?.WebApp?.initData) return () => { try { delete window.onTelegramAuth } catch {} }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    // ВАЖНО: именно выражение с параметром:
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    // Опционально (рекомендуется): явно просим доступ
    script.setAttribute('data-request-access', 'write')

    script.onerror = () => setError('Не удалось загрузить Telegram Login Widget')
    if (ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(script)
    }
    return () => {
      if (ref.current?.firstChild) ref.current.removeChild(ref.current.firstChild)
      try { delete window.onTelegramAuth } catch {}
    }
  }, [botUsername, navigate, location.state])

  // DEV вход (опционально)
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
      if (!data?.token) throw new Error('Empty dev token')
      localStorage.setItem('token', data.token)
      setToken(data.token)
      window.dispatchEvent(new Event('auth:login'))
      navigate(location.state?.from?.pathname || '/settings', { replace: true })
    } catch (e) {
      setError('Dev-вход не удался (проверьте DEV_AUTH_SECRET на сервере).')
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
