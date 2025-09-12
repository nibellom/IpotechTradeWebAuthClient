import { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Box, Alert } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import api from '../api'

// Recharts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

function fmtDate(ts) {
  const d = new Date(ts)
  // короткий локальный формат
  return d.toLocaleString(undefined, {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function CumulativeProfitChart() {
  const { t } = useTranslation()
  const theme = useTheme()
  const [points, setPoints] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/profit/series')
        setPoints(data?.points || [])
      } catch (e) {
        setErr(t('profitChart.loadError'))
      }
    })()
  }, [t])

  const textColor = theme.palette.text.primary
  const gridColor =
    theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(0,0,0,0.08)'

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('profitChart.title')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
          {t('profitChart.subtitle')}
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Box sx={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis
                dataKey="ts"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={fmtDate}
                stroke={textColor}
                tick={{ fill: textColor, fontSize: 12 }}
                minTickGap={24}
              />
              <YAxis
                stroke={textColor}
                tick={{ fill: textColor, fontSize: 12 }}
                tickFormatter={(v) => v.toLocaleString()}
                allowDecimals
              />
              <Tooltip
                labelFormatter={(v) => fmtDate(v)}
                formatter={(value, name) => {
                  if (name === 'cumulative') {
                    return [value, t('profitChart.series.cumulative')]
                  }
                  if (name === 'profit') {
                    return [value, t('profitChart.series.profit')]
                  }
                  return [value, name]
                }}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderColor: gridColor,
                  color: textColor,
                }}
              />
              <ReferenceLine y={0} stroke={gridColor} />
              <Line
                type="monotone"
                dataKey="cumulative"
                name={t('profitChart.series.cumulative')}
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {/*
              // Если захотите показывать отдельные профиты сделок точками — раскомментируйте:
              <Line
                type="monotone"
                dataKey="profit"
                name={t('profitChart.series.profit')}
                stroke={theme.palette.secondary.main}
                strokeWidth={1}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
              */}
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
          {t('profitChart.note')}
        </Typography>
      </CardContent>
    </Card>
  )
}
