import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Stack, Button, Alert, Tooltip } from '@mui/material'
import api, { setToken } from '../api.js'

export default function TelegramGate() {
  const ref = useRef(null)
  const popupRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT || 'ipotechTradeAuthDevBot'
  const botId = import.meta.env.VITE_TELEGRAM_BOT_ID // ← ОБЯЗАТЕЛЬНО задать в .env
  const origin = window.location.origin

  const allowedOriginsRef = useRef(new Set([origin, 'https://oauth.telegram.org']))

  console.log('[TG] mount. bot =', botUsername)
  console.log('[TG] botId =', botId)
  console.log('[TG] VITE_API_BASE =', import.meta.env.VITE_API_BASE)

  // ===== 1) Универсальный обработчик postMessage (popup и debug из widget-authurl)
  useEffect(() => {
    async function handleAuthUser(user) {
      try {
        console.log('[TG] handleAuthUser:', user)
        setError('')
        const { data } = await api.post('/auth/telegram/widget', user)
        console.log('[TG] /auth/telegram/widget →', data)
        if (!data?.token) throw new Error('Empty token in auth response')
        localStorage.setItem('token', data.token)
        setToken(data.token)
        window.dispatchEvent(new Event('auth:login'))
        try {
          await api.get('/users/me')
          console.log('[TG] /users/me ok after login')
        } catch (e) {
          console.warn('[TG] /users/me failed:', e?.response?.status, e?.message)
        }
        navigate(location.state?.from?.pathname || '/settings', { replace: true })
      } catch (e) {
        console.error('[TG] handleAuthUser failed:', e?.response?.status, e?.response?.data || e?.message)
        setError('Не удалось войти через Telegram. Проверьте домен/токен бота и попробуйте снова.')
      } finally {
        try { popupRef.current?.close() } catch {}
      }
    }

    const onMessage = (ev) => {
      // Логируем всё
      console.log('[DBG:message]', ev.origin, ev?.data?.type || '(no type)', ev.data)

      // 1a) Резерв: popup с oauth.telegram.org шлёт JSON строкой {event:'auth_user', user:{...}}
      if (ev.origin === 'https://oauth.telegram.org') {
        let payload = ev.data
        try { if (typeof payload === 'string') payload = JSON.parse(payload) } catch {}
        if (payload && payload.event === 'auth_user' && payload.user?.hash) {
          console.log('[TG] got auth_user from popup')
          return handleAuthUser(payload.user)
        }
      }

      // 1b) Канал от /widget-authurl (popup → сервер → postMessage в opener)
      if (ev?.data?.type === 'tg-auth') {
        if (!allowedOriginsRef.current.has(ev.origin)) {
          console.warn('[TG] tg-auth from unexpected origin:', ev.origin)
          return
        }
        const token = ev.data.token
        if (!token) return console.warn('[TG] tg-auth without token')
        localStorage.setItem('token', token)
        setToken(token)
        window.dispatchEvent(new Event('auth:login'))
        setTimeout(() => {
          navigate(location.state?.from?.pathname || '/settings', { replace: true })
        }, 50)
      }

      if (ev?.data?.type === 'tg-auth-debug') {
        console.warn('[TG][DEBUG from server]', ev.data)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, location.state])

  // ===== 2) Инициализация виджета: onAuth + auth-url
  useEffect(() => {
    // Глобальный onAuth: дергается самим виджетом
    async function onTelegramAuth(user) {
      console.log('[TG] onAuth callback payload:', user)
      // тот же обработчик
      const evt = new MessageEvent('message', { origin, data: { fake: true } }) // для единообразия логов
      window.dispatchEvent(evt)
      // напрямую отправляем на сервер
      try {
        const { data } = await api.post('/auth/telegram/widget', user)
        console.log('[TG] onAuth server response:', data)
        if (!data?.token) throw new Error('Empty token in /auth/telegram/widget response')
        localStorage.setItem('token', data.token)
        setToken(data.token)
        window.dispatchEvent(new Event('auth:login'))
        navigate(location.state?.from?.pathname || '/settings', { replace: true })
      } catch (e) {
        console.error('[TG] onAuth failed:', e?.response?.status, e?.response?.data || e?.message)
        setError('Не удалось войти через Telegram (onauth).')
      }
    }
    window.onTelegramAuth = onTelegramAuth
    console.log('[TG] window.onTelegramAuth attached:', typeof window.onTelegramAuth)

    // Если открыто внутри Telegram WebApp — другой поток (обрабатывается в App.jsx)
    if (window.Telegram?.WebApp?.initData) {
      console.log('[TG] detected Telegram WebApp, skip widget.')
      return () => { try { delete window.onTelegramAuth } catch {} }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    // Режим колбэка:
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    // Бэкап: редирект на наш сервер (popup вернёт postMessage с токеном)
    const authUrl = `${origin}/auth/telegram/widget-authurl`
    script.setAttribute('data-auth-url', authUrl)

    console.log('[TG] widget attrs:', {
      'data-telegram-login': botUsername,
      'data-size': 'large',
      'data-onauth': 'onTelegramAuth(user)',
      'data-auth-url': authUrl,
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

    // лог iframe
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
  }, [botUsername, navigate, location.state])

  // ===== 3) Fallback-кнопка: открываем oauth.telegram.org в попапе и ловим postMessage
  function openPopupLogin() {
    try {
      if (!botId) {
        setError('VITE_TELEGRAM_BOT_ID не задан — fallback-поток недоступен.')
        return
      }
      setError('')
      const url =
        `https://oauth.telegram.org/auth` +
        `?bot_id=${encodeURIComponent(botId)}` +
        `&origin=${encodeURIComponent(origin)}` +
        `&return_to=${encodeURIComponent(origin + '/signin')}` +
        `&embed=1&request_access=write`
      const w = 550, h = 600
      const left = Math.max(0, (window.screen.width - w) / 2)
      const top = Math.max(0, (window.screen.height - h) / 2)
      popupRef.current = window.open(
        url,
        'tg_oauth_popup',
        `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
      )
      console.log('[TG] popup opened:', url)
    } catch (e) {
      console.error('[TG] popup open failed:', e)
      setError('Браузер заблокировал всплывающее окно. Разрешите popups для этого домена.')
    }
  }

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

          {/* Кнопка/iframe виджета */}
          <div ref={ref} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="text" component={Link} to="/">На главную</Button>

            {/* Fallback: прямой pop-up OAuth (ловим postMessage auth_user) */}
            <Tooltip title="Альтернативный поток, если кнопка выше не завершает вход">
              <span>
                <Button variant="outlined" onClick={openPopupLogin} disabled={!botId}>
                  Войти через Telegram (попап)
                </Button>
              </span>
            </Tooltip>

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
