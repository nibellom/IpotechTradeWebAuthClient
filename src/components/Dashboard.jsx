import { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Button, Alert, Stack, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'
import api from '../api'
import ProfitCard from './ProfitCard.jsx'
import DepositCard from './DepositCard.jsx'
import CumulativeProfitChart from './CumulativeProfitChart'

export default function Dashboard({ me }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [balanceValue, setBalanceValue] = useState(me?.status?.balance || '0')
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceErr, setBalanceErr] = useState('')
  const [balanceOk, setBalanceOk] = useState('')
  
  // Определяем текущее значение useFullBalance
  const useFullBalance = me?.user?.useFullBalance ?? false
  
  // Обновляем значение баланса при изменении me
  useEffect(() => {
    setBalanceValue(me?.status?.balance || '0')
  }, [me?.status?.balance])
  
  const toggleBalanceMode = async () => {
    const newValue = !useFullBalance
    setLoading(true)
    setMsg(null)
    try {
      const { data } = await api.patch('/users/toggle-full-balance', { 
        useFullBalance: newValue 
      })
      if (data?.ok) {
        setMsg({ type: 'success', text: t('dashboard.balanceUpdated') })
        // Обновляем данные пользователя
        window.dispatchEvent(new Event('auth:login'))
      } else {
        throw new Error('Update failed')
      }
    } catch (e) {
      setMsg({ 
        type: 'error', 
        text: e?.response?.data?.error || t('dashboard.updateError') 
      })
    } finally {
      setLoading(false)
    }
  }

  const saveBalance = async () => {
    setBalanceErr('')
    setBalanceOk('')
    setBalanceLoading(true)
    try {
      const { data } = await api.patch('/users/change-balance', { balance: balanceValue })
      if (data?.ok) {
        setBalanceOk(t('balanceEditor.success'))
        window.dispatchEvent(new Event('auth:login'))
      } else {
        throw new Error('non-ok')
      }
    } catch (e) {
      const serverMsg = e?.response?.data?.error
      setBalanceErr(serverMsg || t('balanceEditor.errorGeneric'))
    } finally {
      setBalanceLoading(false)
    }
  }

  return (
    <Grid container spacing={2}>
      {/* Карточка: Биржа */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ opacity:.8 }}>
              {t('dashboard.exchange')}
            </Typography>
            <Typography variant="h5">
              {me?.status?.exchange || '—'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Карточка: Баланс для торговли бота */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ opacity:.8 }}>
              {t('dashboard.balance')}
            </Typography>
            <Typography variant="h5">
              {(me?.status?.balance || '0')} USDT
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Блок прибыли */}
      <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
        <ProfitCard />
      </Grid>

      {/* Блок депозита */}
      <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
        <DepositCard current={me?.status?.depozit || '0'} />
      </Grid>

      <Grid item xs={12} md={6}>
        <CumulativeProfitChart />
      </Grid>

      {/* Блок изменения баланса для торговли бота */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">
                {t('balanceEditor.title')}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {t('balanceEditor.description')}
              </Typography>

              {/* Кнопка переключения режима */}
              {msg && (
                <Alert severity={msg.type} onClose={() => setMsg(null)}>
                  {msg.text}
                </Alert>
              )}
              <Button
                variant="contained"
                onClick={toggleBalanceMode}
                disabled={loading}
                fullWidth
              >
                {useFullBalance 
                  ? t('dashboard.tradeFixedBalance')
                  : t('dashboard.tradeFullBalance')
                }
              </Button>

              {/* Форма для ручного изменения баланса */}
              {balanceErr && <Alert severity="error">{balanceErr}</Alert>}
              {balanceOk && <Alert severity="success">{balanceOk}</Alert>}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('balanceEditor.inputLabel')}
                  type="number"
                  size="small"
                  value={balanceValue}
                  inputProps={{ min: 0, step: '0.01' }}
                  onChange={(e) => setBalanceValue(e.target.value)}
                  disabled={useFullBalance || balanceLoading}
                  sx={{ flex: 1 }}
                />
                <Button 
                  variant="contained" 
                  disabled={useFullBalance || balanceLoading} 
                  onClick={saveBalance}
                >
                  {t('balanceEditor.saveBtn')}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
