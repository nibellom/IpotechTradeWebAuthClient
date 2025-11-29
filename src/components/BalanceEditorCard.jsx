import { useState } from 'react'
import { Card, CardContent, Typography, Stack, TextField, Button, Alert } from '@mui/material'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function BalanceEditorCard({ balance, onUpdated, disabled = false, showTitle = true, showDescription = true }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(balance ?? '')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  async function save() {
    setErr(''); setOk(''); setLoading(true)
    try {
      const { data } = await api.patch('/users/change-balance', { balance: value })
      if (data?.ok) {
        setOk(t('balanceEditor.success'))
        onUpdated?.(data.user?.balance)
        // подтянуть свежий профиль в App без reload
        window.dispatchEvent(new Event('auth:login'))
      } else {
        throw new Error('non-ok')
      }
    } catch (e) {
      // покажем текст сервера, если он есть; иначе — общий
      const serverMsg = e?.response?.data?.error
      setErr(serverMsg || t('balanceEditor.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <>
      {showTitle && (
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('balanceEditor.title')}
        </Typography>
      )}
      {showDescription && (
        <Typography variant="body2" sx={{ mb: 2, opacity: .8 }}>
          {t('balanceEditor.description')}
        </Typography>
      )}

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label={t('balanceEditor.inputLabel')}
          type="number"
          size="small"
          value={value}
          inputProps={{ min: 0, step: '0.01' }}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled || loading}
          sx={{ width: 220 }}
        />
        <Button variant="contained" disabled={disabled || loading} onClick={save}>
          {t('balanceEditor.saveBtn')}
        </Button>
      </Stack>
    </>
  )

  if (showTitle) {
    // Если показываем заголовок, значит это самостоятельный блок с карточкой
    return (
      <Card>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    )
  }

  // Иначе возвращаем только содержимое без карточки
  return content
}
