import { Box, Card, CardContent, Typography, Stack, Button, Alert } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function SignInTelegram() {
  const { t } = useTranslation('translation', { keyPrefix: 'signin' })
  const location = useLocation()
  const bot = import.meta.env.VITE_TELEGRAM_BOT || 'ipotechTradeAuthDevBot'
  const tgLink = `https://t.me/${bot}?startapp=1`

  const hintPath = location.state?.from?.pathname

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
