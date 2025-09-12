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
  Box
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
  const [msg, setMsg] = useState(null)

  const balanceNum = Number(balance || 0)
  const balanceError =
    Number.isNaN(balanceNum) || balanceNum < 500
      ? t('connect.balanceMinError', { min: 500 })
      : ''

  const save = async () => {
    try {
      await api.post('/users/connect', { exchange, apiPub, apiSec, balance: balanceNum })
      setMsg({ type: 'success', text: t('connect.success') })
      // очищаем ключи, чтобы не оставались на экране
      setApiPub('')
      setApiSec('')
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
            error={!!balanceError}
            helperText={balanceError}
          />

          {msg && <Alert severity={msg.type}>{msg.text}</Alert>}

          <Button
            variant="contained"
            onClick={save}
            disabled={!!balanceError}
          >
            {t('connect.save')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
