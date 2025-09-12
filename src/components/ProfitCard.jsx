import { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Stack } from '@mui/material'
import api from '../api.js'
import { useTranslation } from 'react-i18next'

function fmt2(n) {
  const num = Number(n ?? 0)
  return Number.isFinite(num) ? num.toFixed(2) : n
}

export default function ProfitCard() {
  const { t } = useTranslation()
  const [profit, setProfit] = useState({ count: 0, total: 0, totalFunds: 0 })

  async function load() {
    try {
      const { data } = await api.get('/users/profit')
      setProfit({
        count: data?.count ?? 0,
        total: Number(data?.total ?? 0),
        totalFunds: Number(data?.totalFunds ?? 0),
      })
    } catch (e) {
      // тихо игнорим/или можно показать алерт
    }
  }

  useEffect(() => {
    load()
  }, [])

  // чтобы карта обновлялась сразу после логина/изменений профиля
  useEffect(() => {
    const onLogin = () => load()
    window.addEventListener('auth:login', onLogin)
    return () => window.removeEventListener('auth:login', onLogin)
  }, [])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{t('profit.title')}</Typography>

        <Stack spacing={0.5} sx={{ mt: 1 }}>
          <Typography variant="h3" sx={{ my: 0.5 }}>
            {fmt2(profit.total)} USDT
          </Typography>
          <Typography variant="body2" sx={{ opacity:.8 }}>
            {t('dashboard.deals', { count: profit.count })}
          </Typography>
          <Typography variant="h6" sx={{ opacity:.8 }}>
            {t('profit.totalFunds')}: <b>{fmt2(profit.totalFunds)} USDT</b>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
