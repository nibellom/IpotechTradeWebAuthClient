import { useState } from 'react'
import { Card, CardContent, Stack, TextField, Button, Typography, Alert } from '@mui/material'
import api from '../api.js'
import { useTranslation } from 'react-i18next'

export default function DepositCard({ current }) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState(null)

  const submit = async () => {
    try {
      const { data } = await api.post('/users/deposit', { amount })
      setMsg({ type: 'success', text: t('deposit.saved', { amount, new: data.depozit }) })
      setAmount('')
    } catch (e) {
      setMsg({ type: 'error', text: t('deposit.error') })
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">{t('deposit.title')}</Typography>
          <Typography variant="body2" sx={{ opacity:.8 }}>{t('deposit.current', { v: current })}</Typography>
          <TextField label={t('deposit.amount')} value={amount} onChange={e=>setAmount(e.target.value)} />
          {msg && <Alert severity={msg.type}>{msg.text}</Alert>}
          <Button variant="contained" onClick={submit}>{t('deposit.add')}</Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
