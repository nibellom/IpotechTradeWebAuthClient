// client/src/components/SignInTelegram.jsx (updated version)
import { Box, Card, CardContent, Typography, Stack, Button, Alert } from '@mui/material'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import axios from 'axios' // Assuming you use axios for API calls; install if not present

export default function SignInTelegram() {
  const { t } = useTranslation('translation', { keyPrefix: 'signin' })
  const location = useLocation()
  const navigate = useNavigate()
  const bot = import.meta.env.VITE_TELEGRAM_BOT || 'ipotechTradeAuthDevBot'
  const tgLink = `https://t.me/${bot}?startapp=1`
  const [token, setToken] = useState(localStorage.getItem('token')) // Optional: check existing token

  const hintPath = location.state?.from?.pathname

  // Existing postMessage listener (keep for compatibility if needed)
  useEffect(() => {
    const onMsg = (ev) => {
      if (ev?.data?.type === 'tg-auth' && ev.data.token) {
        localStorage.setItem('token', ev.data.token)
        setToken(ev.data.token)
        window.dispatchEvent(new Event('auth:login'))
        navigate('/settings', { replace: true })
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [navigate])

  // New: Detect and handle Telegram Web App (Mini App) context
  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) {
      // We are inside Telegram Mini App
      const initData = window.Telegram.WebApp.initData
      authenticateWithInitData(initData)
    }
  }, [navigate])

  const authenticateWithInitData = async (initData) => {
    try {
      const response = await axios.post('/api/auth/telegram/web-app', { initData }) // Adjust API base URL if needed
      const { token } = response.data
      if (token) {
        localStorage.setItem('token', token)
        setToken(token)
        window.dispatchEvent(new Event('auth:login'))
        navigate('/settings', { replace: true }) // Or to dashboard/home
      }
    } catch (error) {
      console.error('Web App auth error:', error)
      // Optional: show error alert in UI
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 1 }}>{t('title')}</Typography>
          <Typography variant="body1" sx={{ opacity:.9, mb: 3 }}>{t('subtitle')}</Typography>

          <Stack spacing={2} direction={{ xs:'column', sm:'row' }}>
            <Button variant="contained" href={tgLink} target="_blank" rel="noopener">
              {t('openBot')}
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              {t('reload')}
            </Button>
            <Button component={Link} to="/" >
              {t('toHome')}
            </Button>
          </Stack>

          <Typography variant="subtitle2" sx={{ mt:3, opacity:.8 }}>
            {t('hint')}
          </Typography>

          {hintPath && (
            <Alert severity="info" sx={{ mt:1 }}>
              {t('tryingToOpen')} <b>{hintPath}</b>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}