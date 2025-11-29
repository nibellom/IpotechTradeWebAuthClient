import { useState } from 'react'
import {
  Card,
  CardContent,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Alert,
  Box,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import api from '../api.js'
import { useTranslation } from 'react-i18next'

export default function ConnectKeysForm({ me, onSaved }) {
  const { t } = useTranslation()
  const [exchange, setExchange] = useState(
    me?.status?.exchange === 'none' ? 'bybit' : me?.status?.exchange || 'bybit'
  )
  const [apiPub, setApiPub] = useState('')
  const [apiSec, setApiSec] = useState('')
  const [balance, setBalance] = useState(me?.status?.balance || '0')
  const [useFullBalance, setUseFullBalance] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptRisks, setAcceptRisks] = useState(false)
  const [msg, setMsg] = useState(null)

  const balanceNum = Number(balance || 0)
  const balanceError = useFullBalance
    ? '' // Не валидируем, если используется весь баланс
    : (Number.isNaN(balanceNum) || balanceNum < 500
        ? t('connect.balanceMinError', { min: 500 })
        : '')

  // Кнопка неактивна, если не приняты условия и риски
  const isSaveDisabled = !acceptTerms || !acceptRisks || !!balanceError

  const save = async () => {
    try {
      const balanceToSend = useFullBalance ? 0 : balanceNum
      await api.post('/users/connect', { 
        exchange, 
        apiPub, 
        apiSec, 
        balance: balanceToSend,
        useFullBalance 
      })
      setMsg({ type: 'success', text: t('connect.success') })
      // очищаем ключи, чтобы не оставались на экране
      setApiPub('')
      setApiSec('')
      setUseFullBalance(false)
      setAcceptTerms(false)
      setAcceptRisks(false)
      onSaved?.()
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.error || 'Error' })
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{t('connect.title')}</Typography>
            <Typography
              variant="body2"
              component={RouterLink}
              to="/keys-help"
              target="_blank"
              rel="noopener"
              sx={{ color: 'primary.main', textDecoration: 'underline' }}
            >
              {t('connect.help')}
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {t('connect.note')}
          </Typography>

          <FormControl fullWidth>
            <InputLabel>{t('connect.exchange')}</InputLabel>
            <Select
              label={t('connect.exchange')}
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
            >
              <MenuItem value="bybit">Bybit</MenuItem>
              <MenuItem value="binance">Binance</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={t('connect.apiPub')}
            value={apiPub}
            onChange={(e) => setApiPub(e.target.value)}
            fullWidth
          />
          <TextField
            label={t('connect.apiSec')}
            value={apiSec}
            onChange={(e) => setApiSec(e.target.value)}
            type="password"
            fullWidth
          />
          <TextField
            label={t('connect.balance')}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            fullWidth
            disabled={useFullBalance}
            error={!!balanceError}
            helperText={balanceError}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={useFullBalance}
                onChange={(e) => setUseFullBalance(e.target.checked)}
              />
            }
            label={t('connect.useFullBalance')}
          />

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2" component="span">
                    {t('connect.acceptTerms')}{' '}
                    <Typography
                      component={RouterLink}
                      to="/terms"
                      target="_blank"
                      rel="noopener"
                      sx={{ color: 'primary.main', textDecoration: 'underline', display: 'inline' }}
                    >
                      {t('nav.terms')}
                    </Typography>
                  </Typography>
                }
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptRisks}
                    onChange={(e) => setAcceptRisks(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    {t('connect.acceptRisks')}
                  </Typography>
                }
              />
            </Stack>
          </Box>

          {msg && <Alert severity={msg.type}>{msg.text}</Alert>}

          <Button
            variant="contained"
            onClick={save}
            disabled={isSaveDisabled}
            fullWidth
          >
            {t('connect.save')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
