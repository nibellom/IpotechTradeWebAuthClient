import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Stack, Button, Alert, Tooltip } from '@mui/material'
import api, { setToken } from '../api.js'

export default function TelegramGate() {
  const ref = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const bot = import.meta.env.VITE_TELEGRAM_BOT || 'ipotechTradeAuthDevBot'
  console.log('Bot name: ', bot)

  // Приём токена из резервного потока (data-auth-url → postMessage)
  useEffect(() => {
    function onMsg(ev) {
      if (ev?.data?.type === 'tg-auth' && ev.data.token) {
        localStorage.setItem('token', ev.data.token)
        setToken(ev.data.token)
        // уведомляем App, чтобы он подтянул профиль без перезагрузки
        window.dispatchEvent(new Event('auth:login'))
        navigate(location.state?.from?.pathname || '/settings', { replace: true })
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [navigate, location.state])

  useEffect(() => {
    // Если открыто внутри Telegram WebApp — здесь ничего не делаем (initData обрабатывается в App.jsx)
    if (window.Telegram?.WebApp?.initData) return

    // Основной JS-коллбэк виджета
    window.onTelegramAuth = async (user) => {
      setError('')
      try {
        // ВНИМАНИЕ: предполагается, что VITE_API_BASE = '/api' в client/.env.development
        // и axios baseURL уже указывает на '/api', поэтому путь здесь БЕЗ префикса /api
        const { data } = await api.post('/auth/telegram/widget', user)
        localStorage.setItem('token', data.token)
        setToken(data.token)
        // уведомляем App
        window.dispatchEvent(new Event('auth:login'))
        navigate(location.state?.from?.pathname || '/settings', { replace: true })
      } catch (e) {
        console.error('Widget POST auth failed', e?.response?.status, e?.response?.data)
        setError('Не удалось авторизоваться через Telegram. Попробуйте ещё раз.')
      }
    }

    // Встраиваем виджет Telegram
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', bot)              // имя бота без "@"
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth')         // основной поток (JS-коллбэк)

    // РЕЗЕРВНЫЙ поток: Telegram откроет новое окно с GET на этот URL.
    // Сервер проверит подпись, вернёт токен и отправит его обратно сюда через postMessage.
    // ВАЖНО: это навигация браузера, не axios — поэтому здесь НУЖЕН префикс /api.
    // РЕЗЕРВНЫЙ поток: укажем АБСОЛЮТНЫЙ URL бэкенда
    const publicApi = (import.meta.env.VITE_PUBLIC_API?.trim())
      || (import.meta.env.VITE_API_BASE?.trim())         // если это уже абсолютное https://.../api
      || `${window.location.origin}/api`
    const authUrl = `${publicApi.replace(/\/+$/, '')}/auth/telegram/widget-authurl`
    script.setAttribute('data-auth-url', authUrl)
    // На время отладки уберём требование write-доступа
    // script.setAttribute('data-request-access', 'write')

    script.onload = () => console.log('[TelegramGate] widget script loaded')
    script.onerror = () => setError('Не удалось загрузить виджет Telegram')

    ref.current?.appendChild(script)

    return () => {
      delete window.onTelegramAuth
      if (ref.current && script.parentNode === ref.current) {
        ref.current.removeChild(script)
      }
    }
  }, [bot, navigate, location.state])

  const devEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === '1'

  async function handleDevLogin() {
    try {
      setError('')
      const tgId = import.meta.env.VITE_DEV_TGID || '999000'
      const username = import.meta.env.VITE_DEV_USERNAME || 'AlekseyDev'

      const { data } = await api.post('/auth/dev/login',
        { tgId, username, firstName: 'Dev', lastName: 'User' },
        { headers: { 'x-dev-auth': import.meta.env.VITE_DEV_AUTH_HEADER || '' } }
      )
      localStorage.setItem('token', data.token)
      setToken(data.token)
      // уведомляем App
      window.dispatchEvent(new Event('auth:login'))
      navigate(location.state?.from?.pathname || '/settings', { replace: true })
    } catch (e) {
      console.error('Dev login failed', e?.response?.status, e?.response?.data)
      setError('Dev-вход не удался. Проверьте DEV_AUTH_SECRET и перезапустите сервер.')
    }
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Войти через Telegram
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: .85 }}>
            Авторизуйтесь через Telegram. После успешного входа вы будете перенаправлены автоматически.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Здесь появится кнопка Telegram Login Widget */}
          <div ref={ref} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="text" component={Link} to="/">На главную</Button>

            {devEnabled && (
              <Tooltip title="Фейковый вход для разработки, не используется на проде">
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
