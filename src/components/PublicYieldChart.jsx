import { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Box, Alert } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import api from '../api'

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
  return d.toLocaleString(undefined, {
    year: '2-digit', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function PublicYieldChart() {
  const { t } = useTranslation()
  const theme = useTheme()
  const [data, setData] = useState([])
  const [err, setErr] = useState('')
  const [lastPct, setLastPct] = useState(0)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/public/profit/series')
        setData(data?.points || [])
        setLastPct(Number(data?.lastPct || 0))
      } catch (e) {
        setErr(t('profitChart.loadError'))
      }
    })()
  }, [t])

  const textColor = theme.palette.text.primary
  const gridColor = theme.palette.mode === 'dark'
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.08)'

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('publicYield.title')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: .8 }}>
          {t('publicYield.subtitle')}
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Box sx={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
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
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                allowDecimals
              />
              <Tooltip
                labelFormatter={(v) => fmtDate(v)}
                formatter={(value, name) => {
                  if (name === 'pct') return [`${Number(value).toFixed(2)}%`, t('publicYield.seriesPct')]
                  if (name === 'cumulative') return [Number(value).toFixed(2), t('profitChart.series.cumulative')]
                  return [value.toFixed(2), name]
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
                dataKey="pct"
                name={t('publicYield.seriesPct')}
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
          {t('publicYield.note')}
        </Typography>

        <Typography variant="body2" sx={{ mt: 1, opacity: 0.85 }}>
          {t('publicYield.current')}: <b>{lastPct.toFixed(2)}%</b>
        </Typography>
      </CardContent>
    </Card>
  )
}
