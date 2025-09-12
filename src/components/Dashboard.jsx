import { Grid, Card, CardContent, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ProfitCard from './ProfitCard.jsx'
import DepositCard from './DepositCard.jsx'
import BalanceEditorCard from '../components/BalanceEditorCard'
import CumulativeProfitChart from './CumulativeProfitChart'

export default function Dashboard({ me }) {
  const { t } = useTranslation()

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
      <Grid item xs={12} md={6}>
        <ProfitCard />
      </Grid>

       {/* Карточка обновления баланса */}
       <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <BalanceEditorCard
              balance={me.balance}
              onUpdated={(newBalance) => {
                // опционально: локально обновить отображение, если держите me в состоянии страницы
                // setMe(prev => ({ ...prev, balance: newBalance }))
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <CumulativeProfitChart />
      </Grid>

      {/* Блок депозита */}
      <Grid item xs={12} md={6}>
        <DepositCard current={me?.status?.depozit || '0'} />
      </Grid>
    </Grid>
  )
}
