// client/src/pages/ApiKeysGuide.jsx
import { Box, Card, CardContent, Typography, Alert, Divider, List, ListItem } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function ApiKeysGuide() {
  const { t } = useTranslation()
  const allowedIp = import.meta.env.VITE_ALLOWED_IP || '212.67.29.199'

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {t('keysGuide.title')}
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <b>{t('keysGuide.ipTitle')}</b>{' '}
            {t('keysGuide.ipText', { ip: allowedIp })}
          </Alert>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t('keysGuide.common.title')}
          </Typography>
          <List sx={{ mb: 2 }}>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.common.item1')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.common.item2')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.common.item3', { ip: allowedIp })}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.common.item4')}</ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>
            Bybit
          </Typography>
          <List sx={{ mb: 2 }}>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.bybit.step1')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.bybit.step2')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.bybit.step3')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.bybit.step4', { ip: allowedIp })}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.bybit.step5')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.bybit.step6')}</ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>
            Binance
          </Typography>
          <List sx={{ mb: 2 }}>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.binance.step1')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.binance.step2')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.binance.step3')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.binance.step4')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.binance.step5', { ip: allowedIp })}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.binance.step6')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.binance.step7')}</ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('keysGuide.form.title')}
          </Typography>
          <List sx={{ mb: 2 }}>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.form.item1')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.form.item2')}</ListItem>
            <ListItem sx={{ py: 0.5 }}>{t('keysGuide.form.item3')}</ListItem>
          </List>

          <Alert severity="warning">
            {t('keysGuide.warning', { ip: allowedIp })}
          </Alert>
        </CardContent>
      </Card>
    </Box>
  )
}
