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

  const allowedOriginsRef = useRef(new Set([window.location.origin]))

  console.log('[TG] mount. bot =', bot)
  console.log('[TG] VITE_API_BASE =', import.meta.env.VITE_API_BASE)

  // ЛОГИРУЕМ все postMessage для диагностики (канал data-auth-url → postMessage из popup)
  useEffect(() => {
    const handler = (ev) => {
      console.log('[DBG:message]', ev.origin, ev?.data?.type || '(no type)', ev.data)
      // Основной поток postMessage — 'tg-auth'
      if (ev?.data?.type === 'tg-auth') {
        if (!allowedOriginsRef.current.has(ev.origin)) {
          console.warn('[TG] tg-auth from unexpected origin:', ev.origin, 'allowed=', [...allowedOriginsRef.current])
          return
        }
        const token = ev.data.token
        if (!token) {
          console.warn('[TG] tg-auth without token')
          return
        }
        localStorage.setItem('token', token)
        setToken(token)
        window.dispatchEvent(new Event('auth:login'))
        setTimeout(() => {
          navigate(location.state?.from?.pathname || '/settings', { replace: true })
        }, 50)
      }

      // Диагностический канал от сервера — 'tg-auth-debug'
      if (ev?.data?.type === 'tg-auth-debug') {
        console.warn('[TG][DEBUG from server]', ev.data)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [navigate, location.state])

  useEffect(() => {
    // РЕЗЕРВНЫЙ ПУТЬ: onAuth из виджета (обходит блоки попапа / third-party cookies)
    function onTelegramAuth(user) {
      try {
        console.log('[TG] onAuth callback payload:', user)
      } catch {}

      ;(async () => {
        try {
          setError('')
          // Отправляем объект user (id/username/first_name/last_name/auth_date/hash/…) на сервер
          const { data } = await api.post('/auth/telegram/widget', user)
          console.log('[TG] onAuth server response:', data)

          if (!data?.token) throw new Error('Empty token in /auth/telegram/widget response')

          localStorage.setItem('token', data.token)
          setToken(data.token)
          window.dispatchEvent(new Event('auth:login'))

          try {
            await api.get('/users/me')
            console.log('[TG] /users/me ok after onAuth login')
          } catch (e) {
            console.warn('[TG] /users/me after onAuth failed:', e?.response?.status, e?.message)
          }

          navigate(location.state?.from?.pathname || '/settings', { replace: true })
        } catch (e) {
          console.error('[TG] onAuth failed:', e?.response?.status, e?.response?.data || e?.message)
          setError('Не удалось войти через Telegram (onauth). Проверьте, что домен и токен бота заданы верно.')
        }
      })()
    }
    // Виджет вызывает window.onTelegramAuth по имени функции
    window.onTelegramAuth = onTelegramAuth

    // Если это Telegram WebApp — виджет не нужен (отдельный поток /auth/telegram/webapp)
    if (window.Telegram?.WebApp?.initData) {
      console.log('[TG] detected Telegram WebApp, skip widget.')
      return () => {
        try { delete window.onTelegramAuth } catch {}
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', bot)
    script.setAttribute('data-size', 'large')

    // Включаем onAuth как основной путь (без всплывающего окна):
    script.setAttribute('data-onauth', 'onTelegramAuth')

    // Оставляем data-auth-url как бэкап (попап → GET /widget-authurl → postMessage token)
    const authUrl = `${window.location.origin}/api/auth/telegram/widget-authurl`
    script.setAttribute('data-auth-url', authUrl)

    // Разрешённые источники для postMessage
    allowedOriginsRef.current.add('https://oauth.telegram.org')
    allowedOriginsRef.current.add(window.location.origin)

    console.log('[TG] widget attrs:', {
      'data-telegram-login': bot,
      'data-size': 'large',
      'data-auth-url': authUrl,
      'data-onauth': 'onTelegramAuth',
    })
    console.log('[TG] allowed origins =', [...allowedOriginsRef.current])

    script.onload = () => console.log('[TG] widget script loaded')
    script.onerror = () => {
      console.error('[TG] widget script load failed')
      setError('Не удалось загрузить виджет Telegram')
    }

    if (ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(script)
    } else {
      console.warn('[TG] ref is null, widget not appended')
    }

    // Отслеживаем появление iframe и его src
    const mo = new MutationObserver(() => {
      const iframe = ref.current?.querySelector('iframe')
      if (iframe && !iframe.__dbg) {
        iframe.__dbg = true
        console.log('[DBG:iframe] src =', iframe.getAttribute('src') || iframe.src)
        iframe.addEventListener('load', () => {
          console.log('[DBG:iframe load] src =', iframe.getAttribute('src') || iframe.src)
        })
        iframe.addEventListener('error', (e) => {
          console.warn('[DBG:iframe error]', e)
        })
      }
    })
    if (ref.current) mo.observe(ref.current, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      if (ref.current?.firstChild) {
        ref.current.removeChild(ref.current.firstChild)
      }
      try { delete window.onTelegramAuth } catch {}
    }
  }, [bot, navigate, location.state])

  const devEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === '1'

  async function handleDevLogin() {
    try {
      setError('')
      const tgId = import.meta.env.VITE_DEV_TGID || '999000'
      const username = import.meta.env.VITE_DEV_USERNAME || 'AlekseyDev'

      console.log('[TG] DEV login start...')
      const { data } = await api.post('/auth/dev/login',
        { tgId, username, firstName: 'Dev', lastName: 'User' },
        { headers: { 'x-dev-auth': import.meta.env.VITE_DEV_AUTH_HEADER || '' } }
      )
      console.log('[TG] DEV login response:', data)

      if (!data?.token) throw new Error('Empty token in dev response')

      localStorage.setItem('token', data.token)
      setToken(data.token)
      window.dispatchEvent(new Event('auth:login'))

      try {
        await api.get('/users/me')
        console.log('[TG] /users/me ok after DEV login')
      } catch (e) {
        console.warn('[TG] /users/me after DEV login failed:', e?.response?.status, e?.message)
      }

      navigate(location.state?.from?.pathname || '/settings', { replace: true })
    } catch (e) {
      console.error('[TG] Dev login failed:', e?.response?.status, e?.response?.data || e?.message)
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
