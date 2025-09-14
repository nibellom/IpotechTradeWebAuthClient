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

  // Разрешённые источники postMessage (origin)
  const allowedOriginsRef = useRef(new Set([window.location.origin]))

  console.log('[TelegramGate] mount. bot =', bot)
  console.log('[TelegramGate] VITE_API_BASE =', import.meta.env.VITE_API_BASE)
  console.log('[TelegramGate] Using SAME-ORIGIN data-auth-url', `${window.location.origin}/api/auth/telegram/widget-authurl`)

  // Приём токена из резервного потока (data-auth-url → postMessage)
  useEffect(() => {
    function onMsg(ev) {
      try {
        // Интересуют только наши сообщения
        if (!ev?.data || ev.data.type !== 'tg-auth') return

        // Проверяем origin
        const allowed = allowedOriginsRef.current
        const isAllowed = allowed.has(ev.origin)
        if (!isAllowed) {
          console.warn('[TelegramGate] tg-auth from unexpected origin:', ev.origin, 'allowed =', [...allowed])
          return
        }

        console.log('[TelegramGate] tg-auth OK from', ev.origin)
        const token = ev.data.token
        if (!token) {
          console.warn('[TelegramGate] tg-auth without token, skip.')
          return
        }

        localStorage.setItem('token', token)
        setToken(token)
        window.dispatchEvent(new Event('auth:login'))

        // Небольшая задержка, чтобы стор/профиль успели обновиться
        setTimeout(() => {
          navigate(location.state?.from?.pathname || '/settings', { replace: true })
        }, 50)
      } catch (e) {
        console.error('[TelegramGate] onMsg error:', e)
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [navigate, location.state])

  useEffect(() => {
    // Если открыто внутри Telegram WebApp — initData обрабатывается в App.jsx
    if (window.Telegram?.WebApp?.initData) {
      console.log('[TelegramGate] detected Telegram WebApp, skip widget.')
      return
    }

    // Встраиваем виджет Telegram
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', bot) // имя бота без "@"
    script.setAttribute('data-size', 'large')
    // ВАЖНО: НЕ используем data-onauth — работаем через data-auth-url + postMessage
    // script.setAttribute('data-onauth', 'onTelegramAuth')

    // Официальный резервный поток: data-auth-url → (rewrites на бэкенд) → postMessage
    const authUrl = `${window.location.origin}/api/auth/telegram/widget-authurl`
    script.setAttribute('data-auth-url', authUrl)

    // Добавим origin oauth.telegram.org просто чтобы не спамили служебные postMessage-ы
    try {
      allowedOriginsRef.current.add('https://oauth.telegram.org')
      console.log('[TelegramGate] allowed postMessage origins =', [...allowedOriginsRef.current])
    } catch (e) {
      console.warn('[TelegramGate] failed to build allowedOrigins:', e?.message)
    }

    script.onload = () => console.log('[TelegramGate] widget script loaded')
    script.onerror = () => {
      console.error('[TelegramGate] widget script load failed')
      setError('Не удалось загрузить виджет Telegram')
    }

    if (ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(script)
    } else {
      console.warn('[TelegramGate] ref is null, widget not appended')
    }

    return () => {
      if (ref.current?.firstChild) {
        ref.current.removeChild(ref.current.firstChild)
      }
    }
  }, [bot, navigate, location.state])

  const devEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === '1'

  async function handleDevLogin() {
    try {
      setError('')
      const tgId = import.meta.env.VITE_DEV_TGID || '999000'
      const username = import.meta.env.VITE_DEV_USERNAME || 'AlekseyDev'

      console.log('[TelegramGate] DEV login start...')
      const { data } = await api.post('/auth/dev/login',
        { tgId, username, firstName: 'Dev', lastName: 'User' },
        { headers: { 'x-dev-auth': import.meta.env.VITE_DEV_AUTH_HEADER || '' } }
      )
      console.log('[TelegramGate] DEV login response:', data)

      if (!data?.token) throw new Error('Empty token in dev response')

      localStorage.setItem('token', data.token)
      setToken(data.token)
      window.dispatchEvent(new Event('auth:login'))

      try {
        await api.get('/users/me')
        console.log('[TelegramGate] /users/me ok after DEV login')
      } catch (e) {
        console.warn('[TelegramGate] /users/me after DEV login failed:', e?.response?.status, e?.message)
      }

      navigate(location.state?.from?.pathname || '/settings', { replace: true })
    } catch (e) {
      console.error('[TelegramGate] Dev login failed:', e?.response?.status, e?.response?.data || e?.message)
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
